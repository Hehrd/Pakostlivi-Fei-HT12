package com.mischievous.fairies.service;

import com.mischievous.fairies.common.exceptions.UserNotExistingException;
import com.mischievous.fairies.controller.dtos.request.ClientReqDTO;
import com.mischievous.fairies.controller.dtos.response.ClientResDTO;
import com.mischievous.fairies.persistence.model.AccountEntity;
import com.mischievous.fairies.persistence.model.ClientEntity;
import com.mischievous.fairies.persistence.repository.AccountRepository;
import com.mischievous.fairies.persistence.repository.ClientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ClientService {
    private final AccountRepository accountRepository;
    private final ClientRepository clientRepository;

    @Autowired
    public ClientService(AccountRepository accountRepository,
                         ClientRepository clientRepository) {
        this.accountRepository = accountRepository;
        this.clientRepository = clientRepository;
    }


    public void saveUser(ClientReqDTO clientReqDTO, String email) {
        AccountEntity accountEntity = accountRepository.findByEmail(email)
                                        .orElseThrow(() -> new UserNotExistingException("User not found"));

        ClientEntity clientEntity = new ClientEntity();
        clientEntity.setFirstname(clientReqDTO.getFirstName());
        clientEntity.setLastname(clientReqDTO.getLastName());
        clientEntity.setProfilePictureUrl(clientReqDTO.getProfilePictureUrl());
        clientEntity.setAccount(accountEntity);

        clientRepository.save(clientEntity);
    }

    public ClientResDTO getClientByEmail(String email) {
        ClientEntity clientEntity = clientRepository.findByAccountEmail(email)
                .orElseThrow(() -> new UserNotExistingException("Client not found"));

        ClientResDTO clientResDTO = new ClientResDTO();
        clientResDTO.setId(clientEntity.getId());
        clientResDTO.setFirstName(clientEntity.getFirstname());
        clientResDTO.setLastName(clientEntity.getLastname());

        return clientResDTO;
    }

    public void setProfilePicture() {

    }

}
