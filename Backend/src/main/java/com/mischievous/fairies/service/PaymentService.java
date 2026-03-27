package com.mischievous.fairies.service;

import com.mischievous.fairies.controller.dtos.request.payment.PaymentDetailsReqDto;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    private static final long MIN_AMOUNT = 1L;
    private static final long MUNCHMAN_CUT_PERCENTAGE = 5L;

    public PaymentService(@Value("${stripe.secret-key}") String stripeSecretKey) {
        Stripe.apiKey = stripeSecretKey;
    }

    public String createPaymentIntent(PaymentDetailsReqDto paymentDetails) throws StripeException {
        validateAmount(paymentDetails);

        long amount = paymentDetails.getAmount();
        long platformFee = calculatePlatformFee(amount);

        PaymentIntentCreateParams params =
                PaymentIntentCreateParams.builder()
                        .setAmount(amount)
                        .setCurrency("eur")
                        .setApplicationFeeAmount(platformFee)
                        .setAutomaticPaymentMethods(
                                PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                        .setEnabled(true)
                                        .build()
                        )
                        .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);
        return paymentIntent.getClientSecret();
    }

    private void validateAmount(PaymentDetailsReqDto paymentDetails) {
        if (paymentDetails == null) {
            throw new IllegalArgumentException("Payment details cannot be null.");
        }

        if (paymentDetails.getAmount() < MIN_AMOUNT) {
            throw new IllegalArgumentException("Amount must be greater than 0.");
        }
    }

    private long calculatePlatformFee(long amount) {
        return (amount * MUNCHMAN_CUT_PERCENTAGE) / 100;
    }
}