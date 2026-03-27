package com.mischievous.fairies.controller;

import com.mischievous.fairies.controller.dtos.request.payment.PaymentDetailsReqDto;
import com.mischievous.fairies.service.PaymentService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final String webhookSecret = "";

    public PaymentController(
            PaymentService paymentService
//            @Value("${stripe.webhook-secret}") String webhookSecret
    ) {
        this.paymentService = paymentService;
//        this.webhookSecret = webhookSecret;
    }

    @PostMapping
    public ResponseEntity<ClientSecretResDto> createPaymentIntent(
            @RequestBody PaymentDetailsReqDto paymentDetails
    ) throws StripeException {

        String clientSecret = paymentService.createPaymentIntent(paymentDetails);
        return ResponseEntity.ok(new ClientSecretResDto(clientSecret));
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader
    ) {

        try {
            Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);

            switch (event.getType()) {
                case "payment_intent.succeeded":
                    // handle success (e.g. mark order paid)
                    break;

                case "payment_intent.payment_failed":
                    // handle failure
                    break;

                default:
                    break;
            }

            return ResponseEntity.ok("success");

        } catch (SignatureVerificationException e) {
            return ResponseEntity.badRequest().body("Invalid signature");
        }
    }

    @Data
    @AllArgsConstructor
    private static class ClientSecretResDto {
        private String clientSecret;
    }
}