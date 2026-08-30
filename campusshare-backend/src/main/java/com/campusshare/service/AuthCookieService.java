package com.campusshare.service;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class AuthCookieService {
    @Value("${app.auth.refresh-cookie-name:campusshare_refresh}")
    private String cookieName;

    @Value("${app.auth.refresh-cookie-secure:false}")
    private boolean secure;

    @Value("${app.auth.refresh-cookie-same-site:Lax}")
    private String sameSite;

    @Value("${jwt.refresh-expiration:2592000000}")
    private long refreshExpirationMs;

    public String cookieName() {
        return cookieName;
    }

    public void setRefreshCookie(HttpServletResponse response, String refreshToken, boolean rememberMe) {
        Duration maxAge = rememberMe ? Duration.ofMillis(refreshExpirationMs) : Duration.ofDays(1);
        ResponseCookie cookie = ResponseCookie.from(cookieName, refreshToken)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
