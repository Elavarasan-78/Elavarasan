package com.smartquiz.portal.repository;

import com.smartquiz.portal.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByCategoryId(Long categoryId);
}
