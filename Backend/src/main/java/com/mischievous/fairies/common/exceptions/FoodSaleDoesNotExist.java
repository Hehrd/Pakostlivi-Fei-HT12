package com.mischievous.fairies.common.exceptions;

import com.mischievous.fairies.common.CustomException;
import org.springframework.http.HttpStatus;

public class FoodSaleDoesNotExist extends CustomException {
    public FoodSaleDoesNotExist(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
