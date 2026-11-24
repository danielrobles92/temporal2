package com.example.pets.petproject.domain.core;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.example.pets.petproject.domain.port.PasswordResetCodeRepositoryDB;
import com.example.pets.petproject.domain.port.UserRepositoryDB;
import com.example.pets.petproject.infraestructure.entity.PasswordResetCodeEntity;
import com.example.pets.petproject.infraestructure.entity.UserEntity;
import com.example.pets.petproject.security.LoginAttemptService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Locale;

/**
 * Recuperacion de contrasena con codigo por correo (CU-43). El codigo tiene 6 digitos,
 * vence en 15 minutos, admite 5 intentos y solo se guarda su hash. Mientras no se
 * configure el correo (MAIL_USERNAME / MAIL_PASSWORD), el codigo se escribe en el log
 * del backend para poder probar el flujo.
 */
@Service
@Slf4j
public class PasswordResetService {

    private static final int CODE_MINUTES = 15;
    private static final int MAX_ATTEMPTS = 5;
    private static final int RESEND_SECONDS = 60;
    private static final String INVALID_CODE = "El código no es válido o ya venció. Solicita uno nuevo.";

    private final SecureRandom random = new SecureRandom();
    private final UserRepositoryDB userRepository;
    private final PasswordResetCodeRepositoryDB resetRepository;
    private final LoginAttemptService loginAttemptService;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final String mailFrom;

    public PasswordResetService(UserRepositoryDB userRepository,
                                PasswordResetCodeRepositoryDB resetRepository,
                                LoginAttemptService loginAttemptService,
                                ObjectProvider<JavaMailSender> mailSender,
                                @Value("${spring.mail.username:}") String mailFrom) {
        this.userRepository = userRepository;
        this.resetRepository = resetRepository;
        this.loginAttemptService = loginAttemptService;
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
    }

    /**
     * Genera y envia un codigo. No revela si el correo existe (anti-enumeracion):
     * para correos no registrados o cuentas desactivadas simplemente no envia nada.
     */
    @Transactional
    public void requestCode(String rawEmail) {
        String email = normalize(rawEmail);
        if (email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo electrónico es requerido");
        }
        UserEntity user = userRepository.findByEmail(email).orElse(null);
        if (user == null || Boolean.FALSE.equals(user.getAccountActive())) {
            return;
        }
        PasswordResetCodeEntity last = resetRepository
                .findFirstByUserIdAndUsedFalseOrderByCreatedAtDesc(user.getId()).orElse(null);
        if (last != null && last.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(RESEND_SECONDS))) {
            return; // evita reenviar codigos en rafaga
        }
        // Solo el codigo mas reciente es valido.
        resetRepository.findByUserIdAndUsedFalse(user.getId()).forEach(c -> c.setUsed(true));

        String code = String.format("%06d", random.nextInt(1_000_000));
        PasswordResetCodeEntity entity = new PasswordResetCodeEntity();
        entity.setUserId(user.getId());
        entity.setCodeHash(BCrypt.withDefaults().hashToString(10, code.toCharArray()));
        entity.setExpiresAt(LocalDateTime.now().plusMinutes(CODE_MINUTES));
        entity.setCreatedAt(LocalDateTime.now());
        resetRepository.save(entity);

        sendCode(user, code);
    }

    /**
     * Verifica el codigo y cambia la contrasena. noRollbackFor: el intento fallido
     * (attempts + 1, o used = true al quinto) debe guardarse aunque se responda con error;
     * sin esto la excepcion deshacia el save y el codigo se podia probar sin limite (PF-09).
     */
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public void confirm(String rawEmail, String rawCode, String newPassword) {
        validatePassword(newPassword);
        String code = rawCode == null ? "" : rawCode.trim();
        UserEntity user = userRepository.findByEmail(normalize(rawEmail))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, INVALID_CODE));
        PasswordResetCodeEntity reset = resetRepository
                .findFirstByUserIdAndUsedFalseOrderByCreatedAtDesc(user.getId())
                .filter(r -> r.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, INVALID_CODE));

        if (!BCrypt.verifyer().verify(code.toCharArray(), reset.getCodeHash()).verified) {
            reset.setAttempts(reset.getAttempts() + 1);
            if (reset.getAttempts() >= MAX_ATTEMPTS) {
                reset.setUsed(true);
                resetRepository.save(reset);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Demasiados intentos con este código. Solicita uno nuevo.");
            }
            resetRepository.save(reset);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El código es incorrecto.");
        }

        user.setPassword(BCrypt.withDefaults().hashToString(12, newPassword.toCharArray()));
        userRepository.save(user);
        reset.setUsed(true);
        resetRepository.save(reset);
        loginAttemptService.onSuccess(user.getEmail()); // quita un bloqueo por intentos fallidos
    }

    /** Mismas reglas que el registro (CU-01). */
    private void validatePassword(String password) {
        if (password == null || password.length() < 6
                || !password.matches(".*[a-z].*") || !password.matches(".*[A-Z].*") || !password.matches(".*\\d.*")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La contraseña debe tener al menos 6 caracteres y combinar mayúsculas, minúsculas y números");
        }
    }

    private void sendCode(UserEntity user, String code) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || mailFrom == null || mailFrom.isBlank()) {
            log.warn("Correo no configurado (MAIL_USERNAME). Codigo de recuperacion para {}: {}", user.getEmail(), code);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(user.getEmail());
        message.setSubject("Código para restablecer tu contraseña - Perreque");
        message.setText("Hola " + user.getUsername() + ":\n\n"
                + "Tu código para restablecer la contraseña es: " + code + "\n\n"
                + "Vence en " + CODE_MINUTES + " minutos. Si no lo solicitaste, ignora este correo; "
                + "tu contraseña no cambiará.\n\nPerreque");
        try {
            sender.send(message);
        } catch (Exception e) {
            log.warn("No se pudo enviar el correo a {} ({}). Codigo de recuperacion: {}",
                    user.getEmail(), e.getMessage(), code);
        }
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
