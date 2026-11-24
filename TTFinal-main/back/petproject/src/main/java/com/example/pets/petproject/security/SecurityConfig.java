package com.example.pets.petproject.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtUtil jwtUtil) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 401 cuando falta/expira la autenticacion (el front hace auto-logout);
                // 403 queda para "autenticado pero sin permiso".
                .exceptionHandling(ex -> ex.authenticationEntryPoint(
                        (request, response, authException) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "No autenticado")))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // publicos
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/users").permitAll()   // registro (rol forzado en el controller)
                        .requestMatchers("/uploads/**", "/error").permitAll()
                        // avisos de avistamiento: traen datos de contacto -> siempre con sesion
                        // (duenio del reporte o admin, validado en ReportsController)
                        .requestMatchers("/reports/sightings", "/reports/sightings/**", "/reports/*/sightings").authenticated()
                        // navegacion publica del catalogo y reportes
                        .requestMatchers(HttpMethod.GET, "/pets/**", "/reports/**").permitAll()
                        // publicar en adopcion requiere autorizacion para publicar
                        .requestMatchers(HttpMethod.POST, "/pets").hasRole("PUBLISHER")
                        .requestMatchers(HttpMethod.PUT, "/pets/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/pets/**").authenticated()
                        // reportes: moderar=admin (RN-12); crear/editar/borrar=autenticado (RN-02/RN-09)
                        .requestMatchers(HttpMethod.PATCH, "/reports/*/moderation").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/reports/*/deactivate").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/reports/matches/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/reports").authenticated()
                        .requestMatchers(HttpMethod.POST, "/images/**").authenticated()   // analisis de fotos (ml-service)
                        .requestMatchers(HttpMethod.PUT, "/reports/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/reports/**").authenticated()
                        // solicitar adopcion requiere sesion (RN-01)
                        .requestMatchers(HttpMethod.POST, "/adoption-requests").authenticated()
                        // solicitudes de adopcion: el listado completo es solo del admin; el resto
                        // requiere sesion (solicitante o publicador, validado en el controller)
                        .requestMatchers(HttpMethod.GET, "/adoption-requests").hasRole("ADMIN")
                        .requestMatchers("/adoption-requests", "/adoption-requests/**").authenticated()
                        // casos: ver todos o borrar = admin; el resto con sesion y solo para
                        // quienes participan en el caso (validado en el controller)
                        .requestMatchers(HttpMethod.GET, "/cases").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/cases/**").hasRole("ADMIN")
                        .requestMatchers("/cases", "/cases/**").authenticated()
                        // notificaciones: siempre con sesion (propiedad validada en el controller)
                        .requestMatchers("/notifications/**").authenticated()
                        // usuarios bloqueados (perfil): con sesion, cada quien ve y quita los suyos
                        .requestMatchers("/blocks", "/blocks/**").authenticated()
                        // reportes de mal uso en los chats: los revisa solo el admin
                        // (reportar es POST /cases/{id}/reports, cubierto arriba por /cases/**)
                        .requestMatchers("/chat-reports", "/chat-reports/**").hasRole("ADMIN")
                        // gestion de usuarios = solo admin
                        .requestMatchers(HttpMethod.GET, "/users").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/users/**").hasRole("ADMIN")
                        // aprobar/eliminar autorizaciones = solo admin
                        .requestMatchers(HttpMethod.PATCH, "/publication-authorizations/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/publication-authorizations/**").hasRole("ADMIN")
                        // self-service de cuenta (propiedad validada en el controller)
                        .requestMatchers("/users/**").authenticated()
                        // resto: permitido por ahora (endurecer por flujo en una siguiente fase)
                        .anyRequest().permitAll()
                )
                .addFilterBefore(new JwtFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://127.0.0.1:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("*"));
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
