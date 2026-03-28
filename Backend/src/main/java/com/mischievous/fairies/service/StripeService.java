package com.mischievous.fairies.service;

import com.mischievous.fairies.common.exceptions.InvalidStripeAccountException;
import com.mischievous.fairies.common.exceptions.JsonDeserializationException;
import com.mischievous.fairies.common.exceptions.ReservationNotFoundException;
import com.mischievous.fairies.common.exceptions.RestaurantNotFoundException;
import com.mischievous.fairies.controller.dtos.request.payment.PaymentDetailsReqDto;
import com.mischievous.fairies.persistence.model.ReservationEntity;
import com.mischievous.fairies.persistence.model.RestaurantEntity;
import com.mischievous.fairies.persistence.model.StripeAccountEntity;
import com.mischievous.fairies.persistence.repository.ReservationRepository;
import com.mischievous.fairies.persistence.repository.RestaurantRepository;
import com.mischievous.fairies.persistence.repository.StripeAccountRepository;
import com.mischievous.fairies.persistence.status.ReservationStatus;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.RequestOptions;
import com.stripe.net.Webhook;
import com.stripe.param.AccountCreateParams;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
public class StripeService {

    private final String WEBHOOK_SECRET;
    private static final long MIN_AMOUNT = 1L;
    private static final long MUNCHMAN_CUT_PERCENTAGE = 5L;


    private final StripeAccountRepository stripeAccountRepository;
    private final RestaurantRepository restaurantRepository;
    private final ReservationRepository reservationRepository;

    public StripeService(@Value("${stripe.secret-key}") String stripeSecretKey,
                         @Value("${stripe.webhook.secret}") String webhookSecret,
                         StripeAccountRepository stripeAccountRepository, RestaurantRepository restaurantRepository, ReservationRepository reservationRepository) {
        this.stripeAccountRepository = stripeAccountRepository;
        this.WEBHOOK_SECRET = webhookSecret;
        this.restaurantRepository = restaurantRepository;
        this.reservationRepository = reservationRepository;
        Stripe.apiKey = stripeSecretKey;
    }

    public void handleWebhook(String payload, String sig) throws StripeException {
        Event event;

        try {
            event = Webhook.constructEvent(
                    payload,
                    sig,
                    WEBHOOK_SECRET);
        } catch (Exception e) {

            throw new JsonDeserializationException(e.getMessage());
        }

        PaymentIntent paymentIntent =
                (PaymentIntent) event
                        .getDataObjectDeserializer()
                        .getObject()
                        .orElse(null);

        switch (event.getType()) {
            case "payment_intent.succeeded":
                ReservationEntity reservationEntity = reservationRepository.findByPaymentIntentId(paymentIntent.getId())
                        .orElseThrow(() -> new ReservationNotFoundException(paymentIntent.getId()));
                reservationEntity.setStatus(ReservationStatus.PAID);
                reservationRepository.save(reservationEntity);
                return;
            case "payment_intent.processing":
                return;
            default:
                reservationRepository.deleteByPaymentIntentId(paymentIntent.getId());

        }

    }

    public String createPaymentIntent(PaymentDetailsReqDto paymentDetails) throws StripeException {
        ReservationEntity reservationEntity = reservationRepository.findById(paymentDetails.getFoodSaleId())
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found for ID: " + paymentDetails.getFoodSaleId()));
        Long restaurantId = reservationEntity.getFoodSaleEntity().getFood().getRestaurant().getId();
        RestaurantEntity restaurantEntity = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RestaurantNotFoundException("Restaurant not found for ID: " + restaurantId));
        StripeAccountEntity stripeAccountEntity = restaurantEntity.getStripeAccount();
        if (stripeAccountEntity == null || stripeAccountEntity.isActive()) {
            throw new InvalidStripeAccountException("Stripe account not found for restaurant ID: " + restaurantId);
        }
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
                        .setTransferData(
                                PaymentIntentCreateParams.TransferData.builder()
                                        .setDestination(stripeAccountEntity.getStripeAccountId())
                                        .build()
                        )
                        .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);
        reservationEntity.setPaymentIntentId(paymentIntent.getId());
        reservationEntity.setAccessCode(UUID.randomUUID().toString());
        reservationRepository.save(reservationEntity);
        return paymentIntent.getClientSecret();
    }

    public String createBusinessAccount(String email, Long restaurantId) throws StripeException {
        AccountCreateParams params = AccountCreateParams.builder()
                .setCountry("BG")
                .setEmail(email)
                .build();

        RequestOptions requestOptions = RequestOptions.builder()
                .setIdempotencyKey(String.valueOf(restaurantId) + UUID.randomUUID().toString())
                .build();

        Account account = Account.create(params, requestOptions);
        return account.getId();
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