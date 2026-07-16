package com.smartquiz.portal.config;

import com.smartquiz.portal.entity.*;
import com.smartquiz.portal.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder {

    private final CategoryRepository categoryRepository;
    private final SubjectRepository subjectRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final OptionRepository optionRepository;

    @PostConstruct
    @Transactional
    public void seedData() {
        if (categoryRepository.count() == 0) {
            System.out.println("Seeding categories and subjects...");

            // 1. Categories
            Category it = Category.builder()
                    .name("Information Technology")
                    .description("Computer Science and Software Development")
                    .build();
            Category math = Category.builder()
                    .name("Mathematics")
                    .description("Core Mathematics, Calculus, and Algebra")
                    .build();
            Category aptitude = Category.builder()
                    .name("General Aptitude")
                    .description("Logical Reasoning and Quantitative Aptitude")
                    .build();

            categoryRepository.saveAll(Arrays.asList(it, math, aptitude));

            // 2. Subjects
            Subject java = Subject.builder()
                    .name("Java Programming")
                    .description("Object Oriented Programming concepts in Java")
                    .category(it)
                    .build();
            Subject sql = Subject.builder()
                    .name("Database Systems (SQL)")
                    .description("Relational Database design, SQL queries and joins")
                    .category(it)
                    .build();
            Subject react = Subject.builder()
                    .name("React Frontend")
                    .description("Modern React JS framework, hooks, and routing")
                    .category(it)
                    .build();

            Subject algebra = Subject.builder()
                    .name("Linear Algebra")
                    .description("Vectors, matrices, and linear spaces")
                    .category(math)
                    .build();

            Subject reasoning = Subject.builder()
                    .name("Logical Reasoning")
                    .description("Pattern matching, analytical reasoning, and puzzles")
                    .category(aptitude)
                    .build();

            subjectRepository.saveAll(Arrays.asList(java, sql, react, algebra, reasoning));

            // 3. Sample Quiz
            System.out.println("Seeding a sample quiz with questions...");
            Quiz quiz = Quiz.builder()
                    .title("Java Fundamentals Practice Quiz")
                    .description("Test your foundational knowledge of Java variables, OOPs, and memory management.")
                    .duration(10)
                    .totalMarks(30)
                    .passMarks(12)
                    .negativeMarks(0.25)
                    .shuffleQuestions(false)
                    .shuffleOptions(false)
                    .maxAttempts(5)
                    .isPublished(true)
                    .subject(java)
                    .createdAt(LocalDateTime.now())
                    .build();

            Quiz savedQuiz = quizRepository.save(quiz);

            // 4. Questions & Options
            // Q1
            Question q1 = Question.builder()
                    .questionText("Which of the following is NOT a primitive data type in Java?")
                    .questionType("MCQ")
                    .marks(10)
                    .explanation("String is a Class in Java, not a primitive data type. Primitives are int, double, float, char, boolean, etc.")
                    .quiz(savedQuiz)
                    .options(new ArrayList<>())
                    .build();
            questionRepository.save(q1);

            List<Option> opts1 = Arrays.asList(
                    Option.builder().optionText("int").isCorrect(false).question(q1).build(),
                    Option.builder().optionText("double").isCorrect(false).question(q1).build(),
                    Option.builder().optionText("String").isCorrect(true).question(q1).build(),
                    Option.builder().optionText("char").isCorrect(false).question(q1).build()
            );
            optionRepository.saveAll(opts1);

            // Q2
            Question q2 = Question.builder()
                    .questionText("What is the purpose of the 'garbage collector' in Java?")
                    .questionType("MCQ")
                    .marks(10)
                    .explanation("The garbage collector automatically reclaims unused heap memory by destroying unreachable objects.")
                    .quiz(savedQuiz)
                    .options(new ArrayList<>())
                    .build();
            questionRepository.save(q2);

            List<Option> opts2 = Arrays.asList(
                    Option.builder().optionText("To run tests on code").isCorrect(false).question(q2).build(),
                    Option.builder().optionText("To automatically free unused memory").isCorrect(true).question(q2).build(),
                    Option.builder().optionText("To prevent class inheritance").isCorrect(false).question(q2).build(),
                    Option.builder().optionText("To optimize CPU scheduling").isCorrect(false).question(q2).build()
            );
            optionRepository.saveAll(opts2);

            // Q3
            Question q3 = Question.builder()
                    .questionText("Which keyword is used by a class to implement an interface?")
                    .questionType("MCQ")
                    .marks(10)
                    .explanation("The 'implements' keyword is used to implement interfaces. 'extends' is used to inherit from other classes.")
                    .quiz(savedQuiz)
                    .options(new ArrayList<>())
                    .build();
            questionRepository.save(q3);

            List<Option> opts3 = Arrays.asList(
                    Option.builder().optionText("extends").isCorrect(false).question(q3).build(),
                    Option.builder().optionText("implements").isCorrect(true).question(q3).build(),
                    Option.builder().optionText("inherits").isCorrect(false).question(q3).build(),
                    Option.builder().optionText("imports").isCorrect(false).question(q3).build()
            );
            optionRepository.saveAll(opts3);

            System.out.println("Default categories, subjects, and Java quiz seeded successfully!");
        }
    }
}
