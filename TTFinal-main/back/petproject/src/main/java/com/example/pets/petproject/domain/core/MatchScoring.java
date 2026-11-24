package com.example.pets.petproject.domain.core;

import com.example.pets.petproject.domain.enums.PetSex;
import com.example.pets.petproject.domain.service.DogDescription;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Porcentaje de coincidencia (0-100) entre un perro perdido y uno encontrado, en dos bloques que se
 * muestran tal cual al usuario. NO es la probabilidad de ser el mismo perro.
 *
 * <pre>
 *   Lo que dice la foto (80) — sale del análisis de la red sobre las fotos de cada perro
 *     Parecido   0-40  coseno del mejor par de fotos (EfficientNet-B0): 0.40 -> 0, 0.70 -> 40
 *     Raza       0-20  misma raza detectada (certeza >= 0.4 en ambos), escalada por la menor certeza
 *     Tamaño     0-8   mismo tamaño detectado (pequeño | mediano | grande)
 *     Etapa      0-4   misma etapa detectada (cachorro | adulto)
 *     Colores    0-8   algún color detectado en común (5 si solo son parecidos)
 *   Lo que capturaron (20) — sale de los formularios
 *     Ubicación  0-12  por distancia entre los puntos del mapa
 *     Sexo       0-4   mismo sexo
 *     Raza y color 0-4 misma raza capturada (2) y algún color capturado en común (2)
 *
 *   Topes: sexo distinto -> 30; razas detectadas distintas (las dos seguras) y fotos no muy
 *   parecidas -> 35; lejos (más de 10 km -> 40, más de 20 km -> 30) salvo que las fotos sean muy
 *   parecidas. Con el aviso en "más de 40 %", un perro lejano solo avisa si las fotos se parecen mucho.
 *
 *   Se muestra y se avisa (isShown): más de 40 % (coincidencia media o alta) Y algún rasgo en común
 *   según la red: fotos parecidas (coseno >= 0.55), misma raza, mismo tamaño, misma etapa o un color igual.
 * </pre>
 *
 * Raza, tamaño, etapa y colores los comparten muchos perros de la misma raza: el parecido de las fotos
 * y la distancia siguen siendo lo que separa a un perro de otro de su raza. Medido con
 * ml-service/experiments/banco_puntaje_80_20.py (fotos de MPDD analizadas por el servicio).
 */
public final class MatchScoring {

    // --- Lo que dice la foto (80) ---
    public static final int PHOTO_MAX = 40;
    public static final int AI_BREED_MAX = 20;
    public static final int AI_SIZE_MAX = 8;
    public static final int AI_STAGE_MAX = 4;
    public static final int AI_COLOR_MAX = 8;
    // --- Lo que capturaron (20) ---
    public static final int LOCATION_MAX = 12;
    public static final int SEX_MAX = 4;
    public static final int FORM_DATA_MAX = 4;

    static final double PHOTO_FROM = 0.40;
    static final double PHOTO_TO = 0.70;
    /** Desde este coseno las fotos se consideran "parecidas" (cuenta como rasgo en común). */
    static final double PHOTO_ALIKE = 0.55;
    /** Certeza mínima para comparar la raza detectada (la red sugiere raza desde 0.4). */
    static final double BREED_USE_FROM = 0.4;
    /** Certeza desde la que dos razas distintas se consideran de verdad distintas. */
    static final double BREED_SURE_FROM = 0.6;

    public static final int SEX_MISMATCH_CAP = 30;
    public static final int BREED_MISMATCH_CAP = 35;
    public static final double MID_KM = 10;
    public static final int MID_CAP = 40;
    public static final double FAR_KM = 20;
    public static final int FAR_CAP = 30;
    /** Solo se guarda, se muestra y se avisa cuando el porcentaje pasa de este valor (media o alta). */
    public static final int NOTIFY_ABOVE = 40;

    private static final List<Set<String>> SIMILAR_COLORS = List.of(
            Set.of("blanco", "crema"), Set.of("crema", "dorado"), Set.of("dorado", "cafe"));

    private MatchScoring() {}

    /** Lo que detectó la red en las fotos de un perro (resumen de todas sus fotos). */
    public record Ai(String breed, Float breedConfidence, String size, String stage, Set<String> colors) {
        public static final Ai NONE = new Ai(null, null, null, null, Set.of());
    }

    /**
     * Datos de un lado de la comparación.
     *
     * @param vectors   vectores de sus fotos
     * @param ai        lo que detectó la red en sus fotos
     * @param userBreed raza capturada en el formulario
     * @param userColor color capturado en el formulario
     */
    public record Side(List<float[]> vectors, Ai ai, String userBreed, String userColor,
                       Double latitude, Double longitude, String location, PetSex sex) {}

    /**
     * @param total              porcentaje de coincidencia 0-100 (con topes)
     * @param visual             mejor coseno entre las fotos (null si alguna no tiene fotos)
     * @param sameDogProbability índice calibrado anterior (solo como dato; ya no se muestra)
     * @param reason             partes legibles separadas por " · " (la interfaz las agrupa)
     * @param photoPoints        puntos del parecido de las fotos (0-40)
     * @param aiPoints           bloque «Lo que dice la foto» (0-80)
     * @param formPoints         bloque «Lo que capturaron» (0-20)
     * @param shared             rasgos en común según la red: "Fotos", "Raza", "Tamaño", "Etapa", "Colores"
     */
    public record Result(int total, Float visual, Float sameDogProbability, String reason, int photoPoints,
                         int aiPoints, int formPoints, List<String> shared) {}

    /**
     * Coincidencia que vale la pena mostrar (y avisar): media o alta (más de 40 %) y con algún rasgo
     * en común. Las bajas o sin nada en común no se guardan ni se muestran.
     */
    public static boolean isShown(Result r) {
        return r.total() > NOTIFY_ABOVE && r.shared() != null && !r.shared().isEmpty();
    }

    /** Junta lo que detectó la red en varias fotos: la raza más segura y el tamaño/etapa más votados. */
    public static final class AiBuilder {
        private String breed;
        private float bestConf = -1f;
        private final Map<String, Integer> sizes = new LinkedHashMap<>();
        private final Map<String, Integer> stages = new LinkedHashMap<>();
        private final Set<String> colors = new LinkedHashSet<>();

        public AiBuilder add(String breed, Float confidence, String size, String stage, String colorsCsv) {
            float conf = confidence != null ? confidence : 0f;
            if (breed != null && conf >= bestConf) {
                bestConf = conf;
                this.breed = breed;
            }
            if (size != null && !size.isBlank()) sizes.merge(size, 1, Integer::sum);
            if (stage != null && !stage.isBlank()) stages.merge(stage, 1, Integer::sum);
            if (colorsCsv != null) {
                for (String c : colorsCsv.split(",")) {
                    if (!c.isBlank()) colors.add(c.trim());
                }
            }
            return this;
        }

        public Ai build() {
            return new Ai(breed, breed != null ? bestConf : null, top(sizes), top(stages), Set.copyOf(colors));
        }

        private static String top(Map<String, Integer> votes) {
            return votes.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(null);
        }
    }

    public static Result score(Side a, Side b) {
        Ai ia = a.ai() != null ? a.ai() : Ai.NONE;
        Ai ib = b.ai() != null ? b.ai() : Ai.NONE;
        List<String> photo = new ArrayList<>();
        List<String> form = new ArrayList<>();

        // ===================== Lo que dice la foto (80) =====================
        // --- Raza detectada ---
        boolean okA = DogDescription.isCatalogBreed(ia.breed()) && conf(ia) >= BREED_USE_FROM;
        boolean okB = DogDescription.isCatalogBreed(ib.breed()) && conf(ib) >= BREED_USE_FROM;
        boolean breedMismatch = false;
        int breedPts = 0;
        String breedPart;
        if (okA && okB && ia.breed().trim().equalsIgnoreCase(ib.breed().trim())) {
            double minConf = Math.min(conf(ia), conf(ib));
            breedPts = (int) Math.round(AI_BREED_MAX * minConf);
            breedPart = "Raza " + breedPts + "/" + AI_BREED_MAX + " (" + ib.breed().trim() + ", "
                    + pct(conf(ia)) + " y " + pct(conf(ib)) + ")";
        } else if (okA && okB) {
            breedMismatch = conf(ia) >= BREED_SURE_FROM && conf(ib) >= BREED_SURE_FROM;
            breedPart = "Raza 0/" + AI_BREED_MAX + " (" + ia.breed().trim() + " y " + ib.breed().trim()
                    + (breedMismatch ? ": razas distintas" : "") + ")";
        } else {
            breedPart = "Raza 0/" + AI_BREED_MAX + " (la red no reconoce la raza en "
                    + (okA ? "su foto" : okB ? "tu foto" : "las fotos") + ")";
        }

        // --- Parecido de las fotos ---
        Float visual = null;
        Float sameDog = null;
        int photoPts = 0;
        double cos = 0.0;
        if (a.vectors() != null && !a.vectors().isEmpty() && b.vectors() != null && !b.vectors().isEmpty()) {
            double best = -1.0;
            for (float[] va : a.vectors()) {
                for (float[] vb : b.vectors()) {
                    best = Math.max(best, ImageEmbeddingService.cosine(va, vb));
                }
            }
            cos = Math.max(0.0, Math.min(1.0, best));
            visual = (float) cos;
            double frac = clamp01((cos - PHOTO_FROM) / (PHOTO_TO - PHOTO_FROM));
            if (breedMismatch) {
                frac *= 0.5;   // otra raza: el parecido cuenta a la mitad
            }
            photoPts = (int) Math.round(frac * PHOTO_MAX);
            double p = ImageEmbeddingService.sameDogProbability(cos) * (breedMismatch ? 0.15 : 1.0);
            sameDog = (float) clamp01(p);
            photo.add("Parecido " + photoPts + "/" + PHOTO_MAX + " (" + photoLabel(cos) + ")");
        } else {
            photo.add("Parecido 0/" + PHOTO_MAX + " (sin foto comparable)");
        }
        photo.add(breedPart);

        // --- Tamaño y etapa detectados ---
        int sizePts = 0;
        if (has(ia.size()) && has(ib.size())) {
            sizePts = ia.size().equalsIgnoreCase(ib.size()) ? AI_SIZE_MAX : 0;
            photo.add("Tamaño " + sizePts + "/" + AI_SIZE_MAX + " (" + (sizePts > 0 ? sizeLabel(ib.size())
                    : sizeLabel(ia.size()) + " y " + sizeLabel(ib.size())) + ")");
        } else {
            photo.add("Tamaño 0/" + AI_SIZE_MAX + " (sin dato)");
        }
        int stagePts = 0;
        if (has(ia.stage()) && has(ib.stage())) {
            stagePts = ia.stage().equalsIgnoreCase(ib.stage()) ? AI_STAGE_MAX : 0;
            photo.add("Etapa " + stagePts + "/" + AI_STAGE_MAX + " (" + (stagePts > 0 ? ib.stage()
                    : ia.stage() + " y " + ib.stage()) + ")");
        } else {
            photo.add("Etapa 0/" + AI_STAGE_MAX + " (sin dato)");
        }

        // --- Colores detectados ---
        Set<String> ca = normSet(ia.colors());
        Set<String> cb = normSet(ib.colors());
        int aiColorPts = 0;
        if (!ca.isEmpty() && !cb.isEmpty()) {
            String shared = ca.stream().filter(cb::contains).findFirst().orElse(null);
            String similar = shared == null ? similarPair(ca, cb) : null;
            aiColorPts = shared != null ? AI_COLOR_MAX : similar != null ? 5 : 0;
            photo.add("Colores " + aiColorPts + "/" + AI_COLOR_MAX + " (" + (shared != null ? capitalize(shared)
                    : similar != null ? similar + ", parecidos" : joinCap(ca) + " / " + joinCap(cb)) + ")");
        } else {
            photo.add("Colores 0/" + AI_COLOR_MAX + " (sin dato)");
        }
        int aiPts = photoPts + breedPts + sizePts + stagePts + aiColorPts;

        // Rasgos en común (los mismos que la interfaz marca con ✓ en «En el análisis se identificó»).
        List<String> shared = new ArrayList<>();
        if (visual != null && cos >= PHOTO_ALIKE) shared.add("Fotos");
        if (breedPts > 0) shared.add("Raza");
        if (sizePts > 0) shared.add("Tamaño");
        if (stagePts > 0) shared.add("Etapa");
        if (aiColorPts == AI_COLOR_MAX) shared.add("Colores");   // un color igual (no solo parecido)

        // ===================== Lo que capturaron (20) =====================
        int locationPts = 0;
        Double km = null;
        if (a.latitude() != null && a.longitude() != null && b.latitude() != null && b.longitude() != null) {
            km = distanceKm(a.latitude(), a.longitude(), b.latitude(), b.longitude());
            locationPts = km <= 1 ? 12 : km <= 2 ? 10 : km <= 3 ? 8 : km <= 5 ? 6 : km <= 10 ? 3 : km <= 20 ? 1 : 0;
            form.add("Ubicación " + locationPts + "/" + LOCATION_MAX + " (a " + distanceLabel(km) + ")");
        } else if (a.location() != null && b.location() != null && normalize(a.location()).equals(normalize(b.location()))) {
            locationPts = 7;
            form.add("Ubicación 7/" + LOCATION_MAX + " (misma ubicación, sin punto en el mapa)");
        } else if (alcaldia(a.location()) != null && alcaldia(a.location()).equals(alcaldia(b.location()))) {
            locationPts = 4;
            form.add("Ubicación 4/" + LOCATION_MAX + " (misma alcaldía, sin punto en el mapa)");
        } else {
            form.add("Ubicación 0/" + LOCATION_MAX + " (lejos o sin dato)");
        }

        int sexPts = 0;
        boolean sexMismatch = false;
        if (a.sex() != null && b.sex() != null) {
            if (a.sex() == b.sex()) {
                sexPts = SEX_MAX;
                form.add("Sexo " + sexPts + "/" + SEX_MAX + " (" + (a.sex() == PetSex.MALE ? "macho" : "hembra") + ")");
            } else {
                sexMismatch = true;
                form.add("Sexo 0/" + SEX_MAX + " (distinto)");
            }
        } else {
            form.add("Sexo 0/" + SEX_MAX + " (sin dato)");
        }

        int dataPts = 0;
        List<String> dataWhy = new ArrayList<>();
        if (DogDescription.isCatalogBreed(a.userBreed()) && DogDescription.isCatalogBreed(b.userBreed())
                && a.userBreed().trim().equalsIgnoreCase(b.userBreed().trim())) {
            dataPts += 2;
            dataWhy.add(b.userBreed().trim());
        }
        Set<String> ua = colorsOf(a.userColor());
        Set<String> ub = colorsOf(b.userColor());
        String sharedUser = ua.stream().filter(ub::contains).findFirst().orElse(null);
        if (sharedUser != null) {
            dataPts += 2;
            dataWhy.add(capitalize(sharedUser));
        } else if (!ua.isEmpty() && !ub.isEmpty() && similarPair(ua, ub) != null) {
            dataPts += 1;
            dataWhy.add(similarPair(ua, ub) + ", parecidos");
        }
        form.add("Raza y color " + dataPts + "/" + FORM_DATA_MAX + " ("
                + (dataWhy.isEmpty() ? "no coinciden" : String.join(", ", dataWhy)) + ")");
        int formPts = locationPts + sexPts + dataPts;

        // ===================== Total y topes =====================
        int total = aiPts + formPts;
        String cap = null;
        if (sexMismatch && total > SEX_MISMATCH_CAP) {
            total = SEX_MISMATCH_CAP;
            cap = "sexo distinto";
        }
        boolean veryAlike = visual != null && cos >= PHOTO_TO;
        if (breedMismatch && !veryAlike && total > BREED_MISMATCH_CAP) {
            total = BREED_MISMATCH_CAP;
            cap = "razas distintas y fotos no muy parecidas";
        }
        if (km != null && !veryAlike) {
            if (km > FAR_KM && total > FAR_CAP) {
                total = FAR_CAP;
                cap = "a más de " + (int) FAR_KM + " km y fotos no muy parecidas";
            } else if (km > MID_KM && total > MID_CAP) {
                total = MID_CAP;
                cap = "a más de " + (int) MID_KM + " km y fotos no muy parecidas";
            }
        }
        List<String> parts = new ArrayList<>(photo);
        parts.addAll(form);
        if (cap != null) {
            parts.add("Tope " + total + "/100 (" + cap + ")");
        }
        return new Result(Math.max(0, Math.min(100, total)), visual, sameDog, String.join(" · ", parts), photoPts,
                aiPts, formPts, List.copyOf(shared));
    }

    /** Colores capturados normalizados ("Tricolor" = negro, blanco y cafe). */
    static Set<String> colorsOf(String color) {
        Set<String> out = new LinkedHashSet<>();
        if (color != null) {
            for (String c : color.split("[,/]| y ")) {
                String n = normalize(c);
                if (n.equals("tricolor")) {
                    out.addAll(List.of("negro", "blanco", "cafe"));
                } else if (!n.isBlank() && !n.equals("otro")) {
                    out.add(n);
                }
            }
        }
        return out;
    }

    private static Set<String> normSet(Set<String> in) {
        Set<String> out = new LinkedHashSet<>();
        if (in != null) {
            in.stream().map(MatchScoring::normalize).filter(n -> !n.isBlank()).forEach(out::add);
        }
        return out;
    }

    private static double conf(Ai ai) {
        return ai.breedConfidence() != null ? ai.breedConfidence() : 0.0;
    }

    private static boolean has(String s) {
        return s != null && !s.isBlank();
    }

    private static String pct(double v) {
        return Math.round(v * 100) + " %";
    }

    private static String sizeLabel(String size) {
        return "pequeno".equalsIgnoreCase(size) ? "pequeño" : size;
    }

    private static String similarPair(Set<String> ca, Set<String> cb) {
        for (String x : ca) {
            for (String y : cb) {
                if (SIMILAR_COLORS.contains(Set.of(x, y))) {
                    return capitalize(x) + " y " + capitalize(y);
                }
            }
        }
        return null;
    }

    private static String photoLabel(double cos) {
        if (cos >= 0.70) return "muy parecidas";
        if (cos >= PHOTO_ALIKE) return "parecidas";
        if (cos >= PHOTO_FROM) return "algo parecidas";
        return "distintas";
    }

    private static String distanceLabel(double km) {
        if (km < 1) {
            return Math.round(km * 1000) + " m";
        }
        return String.format(Locale.US, "%.1f km", km);
    }

    /** Alcaldia de una ubicacion "Alcaldia - detalle" (null si no tiene ese formato). */
    private static String alcaldia(String location) {
        if (location == null || !location.contains(" - ")) {
            return null;
        }
        return normalize(location.substring(0, location.indexOf(" - ")));
    }

    public static double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * r * Math.asin(Math.sqrt(h));
    }

    static String normalize(String s) {
        if (s == null) {
            return "";
        }
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", " ");
    }

    private static double clamp01(double v) {
        return Math.max(0.0, Math.min(1.0, v));
    }

    private static String capitalize(String s) {
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private static String joinCap(Set<String> set) {
        return String.join(", ", set.stream().map(MatchScoring::capitalize).toList());
    }
}
