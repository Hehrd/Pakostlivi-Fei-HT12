package com.mischievous.fairies.common.exceptions;

import com.mischievous.fairies.common.CustomException;
import org.springframework.http.HttpStatus;

public class UnsupportedFoodTagException extends CustomException {
    public UnsupportedFoodTagException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
