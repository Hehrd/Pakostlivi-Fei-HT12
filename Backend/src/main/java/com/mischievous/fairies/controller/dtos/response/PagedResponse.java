package com.mischievous.fairies.controller.dtos.response;

import lombok.Data;

import java.util.List;

@Data
public class PagedResponse<T> {
    private List<T> data;
    private int page;
    private int size;
    private int total;
    private int totalPages;
}
