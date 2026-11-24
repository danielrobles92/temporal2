package com.example.pets.petproject.application;

import com.example.pets.petproject.domain.core.PasswordResetService;
import com.example.pets.petproject.domain.model.LoginRequestDTO;
import com.example.pets.petproject.domain.model.LoginResponseDTO;
import com.example.pets.petproject.domain.model.PasswordResetDTO;
import com.example.pets.petproject.domain.service.LoginService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class LoginController {

    @Autowired
    private LoginService loginService;

    @Autowired
    private PasswordResetService passwordResetService;

    @PostMapping("/login")
    public LoginResponseDTO login(@RequestBody final LoginRequestDTO dto) {
        return loginService.login(dto);
    }

    /** CU-43: envia un codigo al correo. Responde igual exista o no la cuenta. */
    @PostMapping("/password-reset/request")
    public Map<String, String> requestPasswordReset(@RequestBody PasswordResetDTO dto) {
        passwordResetService.requestCode(dto.email());
        return Map.of("message",
                "Si el correo está registrado, te enviamos un código. Revisa tu bandeja de entrada y la carpeta de spam.");
    }

    /** CU-43: con el codigo correcto, cambia la contrasena. */
    @PostMapping("/password-reset/confirm")
    public Map<String, String> confirmPasswordReset(@RequestBody PasswordResetDTO dto) {
        passwordResetService.confirm(dto.email(), dto.code(), dto.newPassword());
        return Map.of("message", "Contraseña actualizada. Ya puedes iniciar sesión.");
    }
}
