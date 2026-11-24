/**
 * Crea el cuestionario SUS de PERREQUE en Google Forms (fuente: DOCS/Cuestionario_SUS.docx)
 * y una hoja de cálculo ligada que calcula el puntaje SUS de cada participante y el promedio.
 */
function crearFormularioSUS() {
  var AFIRMACIONES = [
    'Creo que me gustaría usar este sistema con frecuencia.',
    'Encontré el sistema innecesariamente complejo.',
    'Pensé que el sistema era fácil de usar.',
    'Creo que necesitaría el apoyo de una persona experta para poder usar este sistema.',
    'Encontré que las distintas funciones del sistema estaban bien integradas.',
    'Pensé que había demasiada inconsistencia en el sistema.',
    'Imagino que la mayoría de las personas aprendería a usar este sistema muy rápido.',
    'Encontré el sistema muy difícil de usar.',
    'Me sentí con mucha confianza al usar el sistema.',
    'Necesité aprender muchas cosas antes de poder usar el sistema.'
  ];

  var form = FormApp.create('Cuestionario de usabilidad SUS — PERREQUE');
  form.setDescription(
    'Gracias por probar PERREQUE. Este cuestionario evalúa el sistema, no a usted, y es anónimo: ' +
    'solo escriba el código de participante que le dio la persona que aplica la prueba (por ejemplo, P-01).\n\n' +
    'Califique cada afirmación del 1 al 5: 1 = totalmente en desacuerdo, 5 = totalmente de acuerdo. ' +
    'Responda con su primera impresión.');
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage('¡Gracias! Sus respuestas quedaron registradas.');

  form.addTextItem()
    .setTitle('Código de participante')
    .setHelpText('Ejemplo: P-01')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextMatchesPattern('^[Pp]-[0-9]{2}$')
      .setHelpText('Escriba el código con el formato P-01.')
      .build());

  form.addMultipleChoiceItem()
    .setTitle('Perfil')
    .setChoiceValues(['Me interesa adoptar un perro', 'Pertenezco a un refugio o soy rescatista'])
    .showOtherOption(true)
    .setRequired(true);

  AFIRMACIONES.forEach(function (texto, i) {
    form.addScaleItem()
      .setTitle((i + 1) + '. ' + texto)
      .setBounds(1, 5)
      .setLabels('Totalmente en desacuerdo', 'Totalmente de acuerdo')
      .setRequired(true);
  });

  form.addParagraphTextItem()
    .setTitle('Comentarios (opcional)')
    .setRequired(false);

  try { form.setPublished(true); } catch (e) { Logger.log('setPublished no disponible: ' + e); }

  var linkCorto = form.getPublishedUrl();
  try { linkCorto = form.shortenFormUrl(linkCorto); } catch (e) { /* se queda el largo */ }

  Logger.log('Link para responder: ' + linkCorto);
  Logger.log('Editar formulario:   ' + form.getEditUrl());

  // ---- Hoja de respuestas + puntajes ----
  var ss = SpreadsheetApp.create('Respuestas SUS — PERREQUE');
  var idPuntajes = ss.getSheets()[0].getSheetId();
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  ss = SpreadsheetApp.openById(ss.getId());

  var respuestas = null, puntajes = null;
  ss.getSheets().forEach(function (s) {
    if (s.getSheetId() === idPuntajes) puntajes = s; else if (!respuestas) respuestas = s;
  });
  if (!respuestas) {
    Logger.log('No se encontró la hoja de respuestas; el formulario sí se creó. Hoja: ' + ss.getUrl());
    return;
  }

  puntajes.setName('Puntajes SUS');
  var R = "'" + respuestas.getName().replace(/'/g, "''") + "'!";
  // Columnas de la hoja de respuestas: A marca temporal, B código, C perfil, D..M afirmaciones 1..10, N comentarios
  var sus = '((' + R + 'D2:D-1)+(5-' + R + 'E2:E)+(' + R + 'F2:F-1)+(5-' + R + 'G2:G)+(' + R + 'H2:H-1)' +
            '+(5-' + R + 'I2:I)+(' + R + 'J2:J-1)+(5-' + R + 'K2:K)+(' + R + 'L2:L-1)+(5-' + R + 'M2:M))*2.5';
  var vacio = R + 'B2:B=""';

  puntajes.getRange('A1:D1').setValues([['Participante', 'Perfil', 'Fecha', 'Puntaje SUS']]).setFontWeight('bold');
  puntajes.getRange('A2').setFormula('=ARRAYFORMULA(IF(' + vacio + ',"",UPPER(' + R + 'B2:B)))');
  puntajes.getRange('B2').setFormula('=ARRAYFORMULA(IF(' + vacio + ',"",' + R + 'C2:C))');
  puntajes.getRange('C2').setFormula('=ARRAYFORMULA(IF(' + vacio + ',"",' + R + 'A2:A))');
  puntajes.getRange('D2').setFormula('=ARRAYFORMULA(IF(' + vacio + ',"",' + sus + '))');
  puntajes.getRange('C2:C').setNumberFormat('dd/mm/yyyy');
  puntajes.getRange('D2:D').setNumberFormat('0.0');

  puntajes.getRange('F1').setValue('Resumen').setFontWeight('bold');
  puntajes.getRange('F2:G6').setValues([
    ['Participantes', '=COUNT(D2:D)'],
    ['Puntaje SUS promedio', '=IF(COUNT(D2:D)=0,"",ROUND(AVERAGE(D2:D),1))'],
    ['Criterio RNF-05 a RNF-07 (SUS ≥ 68)', '=IF(COUNT(D2:D)=0,"",IF(AVERAGE(D2:D)>=68,"Cumple","No cumple"))'],
    ['Referencia', '68 = promedio; ≥ 80.3 = 10 % mejor (Sauro, 2011)'],
    ['Cálculo', 'Impares: valor − 1; pares: 5 − valor; suma × 2.5']
  ]);
  puntajes.setFrozenRows(1);
  puntajes.setColumnWidth(1, 110);
  puntajes.setColumnWidth(2, 280);
  puntajes.setColumnWidth(3, 100);
  puntajes.setColumnWidth(4, 110);
  puntajes.setColumnWidth(6, 260);
  puntajes.setColumnWidth(7, 330);

  Logger.log('Hoja de respuestas y puntajes: ' + ss.getUrl());
}
