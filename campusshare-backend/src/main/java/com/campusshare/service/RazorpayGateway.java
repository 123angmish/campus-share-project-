package com.campusshare.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Component
public class RazorpayGateway {
    private static final String BASE_URL = "https://api.razorpay.com/v1";

    private final ObjectMapper mapper;
    private final HttpClient httpClient;

    @Value("${razorpay.key-id:}") private String keyId;
    @Value("${razorpay.key-secret:}") private String keySecret;

    public RazorpayGateway(ObjectMapper mapper) {
        this.mapper = mapper;
        this.httpClient = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build();
    }

    public boolean isConfigured() {
        return keyId != null && !keyId.isBlank() && keySecret != null && !keySecret.isBlank();
    }

    public String keyId() {
        return keyId != null ? keyId : "";
    }

    public String keySecret() {
        return keySecret != null ? keySecret : "";
    }

    public OrderResult createOrder(long amountPaise, String currency, String receipt, Map<String, String> notes) {
        if (!isConfigured()) {
            String mockOrderId = "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
            return new OrderResult(mockOrderId, amountPaise, currency != null ? currency : "INR", "created");
        }
        try {
            String body = mapper.writeValueAsString(Map.of(
                    "amount", amountPaise,
                    "currency", currency,
                    "receipt", receipt,
                    "notes", notes
            ));
            JsonNode json = send("POST", "/orders", body);
            return new OrderResult(json.path("id").asText(), json.path("amount").asLong(),
                    json.path("currency").asText(), json.path("status").asText());
        } catch (RuntimeException e) { throw e; }
        catch (Exception e) { throw new RuntimeException("Could not create payment order", e); }
    }

    public PaymentResult fetchPayment(String paymentId) {
        if (!isConfigured()) {
            return new PaymentResult(paymentId, "order_mock", 0L, "INR", "captured");
        }
        JsonNode json = send("GET", "/payments/" + paymentId, null);
        return payment(json);
    }

    public PaymentResult capturePayment(String paymentId, long amountPaise, String currency) {
        if (!isConfigured()) {
            return new PaymentResult(paymentId, "order_mock", amountPaise, currency, "captured");
        }
        try {
            String body = mapper.writeValueAsString(Map.of("amount", amountPaise, "currency", currency));
            return payment(send("POST", "/payments/" + paymentId + "/capture", body));
        } catch (RuntimeException e) { throw e; }
        catch (Exception e) { throw new RuntimeException("Could not capture payment", e); }
    }

    public RefundResult refund(String paymentId, long amountPaise, String rentalId) {
        if (!isConfigured()) {
            String mockRefundId = "rfnd_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
            return new RefundResult(mockRefundId, paymentId, amountPaise, "processed");
        }
        try {
            String body = mapper.writeValueAsString(Map.of(
                    "amount", amountPaise,
                    "speed", "normal",
                    "notes", Map.of("rentalId", rentalId, "type", "security_deposit_return")
            ));
            JsonNode json = send("POST", "/payments/" + paymentId + "/refund", body);
            return new RefundResult(json.path("id").asText(), json.path("payment_id").asText(),
                    json.path("amount").asLong(), json.path("status").asText("pending"));
        } catch (RuntimeException e) { throw e; }
        catch (Exception e) { throw new RuntimeException("Could not create refund", e); }
    }

    private PaymentResult payment(JsonNode json) {
        return new PaymentResult(
                json.path("id").asText(),
                json.path("order_id").asText(),
                json.path("amount").asLong(),
                json.path("currency").asText(),
                json.path("status").asText()
        );
    }

    private JsonNode send(String method, String path, String body) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(BASE_URL + path))
                    .header("Authorization", "Basic " + basicAuth())
                    .header("Accept", "application/json");
            if (body != null) builder.header("Content-Type", "application/json");
            HttpRequest request = switch (method) {
                case "POST" -> builder.POST(HttpRequest.BodyPublishers.ofString(body == null ? "" : body)).build();
                case "GET" -> builder.GET().build();
                default -> throw new IllegalArgumentException("Unsupported HTTP method");
            };
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode json = mapper.readTree(response.body().isBlank() ? "{}" : response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String description = json.path("error").path("description").asText("Payment provider request failed");
                throw new RuntimeException(description);
            }
            return json;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Payment provider request interrupted", e);
        } catch (RuntimeException e) { throw e; }
        catch (Exception e) { throw new RuntimeException("Payment provider is temporarily unavailable", e); }
    }

    private String basicAuth() {
        return Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
    }

    public record OrderResult(String id, long amount, String currency, String status) {}
    public record PaymentResult(String id, String orderId, long amount, String currency, String status) {}
    public record RefundResult(String id, String paymentId, long amount, String status) {}
}
