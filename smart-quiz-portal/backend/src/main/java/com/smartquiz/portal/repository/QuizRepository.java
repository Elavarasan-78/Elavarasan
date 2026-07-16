package com.smartquiz.portal.repository;

import com.smartquiz.portal.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findBySubjectId(Long subjectId);
    List<Quiz> findByIsPublished(boolean isPublished);
}
