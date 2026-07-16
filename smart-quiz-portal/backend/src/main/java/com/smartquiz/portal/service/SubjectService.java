package com.smartquiz.portal.service;

import com.smartquiz.portal.dto.SubjectDto;
import java.util.List;

public interface SubjectService {
    List<SubjectDto> getAllSubjects();
    List<SubjectDto> getSubjectsByCategory(Long categoryId);
    SubjectDto getSubjectById(Long id);
    SubjectDto createSubject(SubjectDto dto);
    SubjectDto updateSubject(Long id, SubjectDto dto);
    void deleteSubject(Long id);
}
