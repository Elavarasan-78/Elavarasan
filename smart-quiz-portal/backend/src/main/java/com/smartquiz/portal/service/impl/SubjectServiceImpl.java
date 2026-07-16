package com.smartquiz.portal.service.impl;

import com.smartquiz.portal.dto.SubjectDto;
import com.smartquiz.portal.entity.Category;
import com.smartquiz.portal.entity.Subject;
import com.smartquiz.portal.exception.ResourceNotFoundException;
import com.smartquiz.portal.repository.CategoryRepository;
import com.smartquiz.portal.repository.SubjectRepository;
import com.smartquiz.portal.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;
    private final CategoryRepository categoryRepository;

    @Override
    public List<SubjectDto> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<SubjectDto> getSubjectsByCategory(Long categoryId) {
        return subjectRepository.findByCategoryId(categoryId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public SubjectDto getSubjectById(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));
        return mapToDto(subject);
    }

    @Override
    @Transactional
    public SubjectDto createSubject(SubjectDto dto) {
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + dto.getCategoryId()));

        Subject subject = Subject.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .category(category)
                .build();
        Subject saved = subjectRepository.save(subject);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public SubjectDto updateSubject(Long id, SubjectDto dto) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + dto.getCategoryId()));

        subject.setName(dto.getName());
        subject.setDescription(dto.getDescription());
        subject.setCategory(category);
        Subject updated = subjectRepository.save(subject);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void deleteSubject(Long id) {
        if (!subjectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Subject not found with id: " + id);
        }
        subjectRepository.deleteById(id);
    }

    private SubjectDto mapToDto(Subject subject) {
        SubjectDto dto = new SubjectDto();
        dto.setId(subject.getId());
        dto.setName(subject.getName());
        dto.setDescription(subject.getDescription());
        dto.setCategoryId(subject.getCategory().getId());
        dto.setCategoryName(subject.getCategory().getName());
        return dto;
    }
}
