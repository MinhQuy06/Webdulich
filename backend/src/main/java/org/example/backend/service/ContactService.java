package org.example.backend.service;

import org.example.backend.model.Contact;
import org.example.backend.repository.ContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ContactService {

    @Autowired
    private ContactRepository contactRepository;

    public List<Contact> getAll() {
        return contactRepository.findAll();
    }

    public Contact create(Contact contact) {
        if (contact.getEmail() == null || contact.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email không được để trống");
        }
        return contactRepository.save(contact);
    }

    public Contact updateStatus(Long id, String status) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy liên hệ id=" + id));
        contact.setStatus(status);
        return contactRepository.save(contact);
    }

    public boolean delete(Long id) {
        if (!contactRepository.existsById(id)) {
            return false;
        }
        contactRepository.deleteById(id);
        return true;
    }
}