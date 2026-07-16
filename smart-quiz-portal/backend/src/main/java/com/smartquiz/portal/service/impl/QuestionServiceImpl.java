package com.smartquiz.portal.service.impl;

import com.smartquiz.portal.dto.OptionDto;
import com.smartquiz.portal.dto.QuestionDto;
import com.smartquiz.portal.entity.Option;
import com.smartquiz.portal.entity.Question;
import com.smartquiz.portal.entity.Quiz;
import com.smartquiz.portal.exception.BadRequestException;
import com.smartquiz.portal.exception.ResourceNotFoundException;
import com.smartquiz.portal.repository.OptionRepository;
import com.smartquiz.portal.repository.QuestionRepository;
import com.smartquiz.portal.repository.QuizRepository;
import com.smartquiz.portal.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final QuizRepository quizRepository;
    private final OptionRepository optionRepository;

    @Override
    public List<QuestionDto> getQuestionsByQuiz(Long quizId) {
        return questionRepository.findByQuizId(quizId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public QuestionDto getQuestionById(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + id));
        return mapToDto(question);
    }

    @Override
    @Transactional
    public QuestionDto createQuestion(Long quizId, QuestionDto dto) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + quizId));

        long correctCount = dto.getOptions().stream().filter(OptionDto::isCorrect).count();
        if (correctCount != 1) {
            throw new BadRequestException("Exactly one option must be marked as correct");
        }

        Question question = Question.builder()
                .questionText(dto.getQuestionText())
                .questionType(dto.getQuestionType() != null ? dto.getQuestionType() : "MCQ")
                .marks(dto.getMarks())
                .explanation(dto.getExplanation())
                .quiz(quiz)
                .options(new ArrayList<>())
                .build();

        Question saved = questionRepository.save(question);

        List<Option> options = dto.getOptions().stream().map(optDto -> Option.builder()
                .optionText(optDto.getOptionText())
                .isCorrect(optDto.isCorrect())
                .question(saved)
                .build()).collect(Collectors.toList());
        optionRepository.saveAll(options);
        saved.setOptions(options);

        return mapToDto(saved);
    }

    @Override
    @Transactional
    public QuestionDto updateQuestion(Long id, QuestionDto dto) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + id));

        long correctCount = dto.getOptions().stream().filter(OptionDto::isCorrect).count();
        if (correctCount != 1) {
            throw new BadRequestException("Exactly one option must be marked as correct");
        }

        question.setQuestionText(dto.getQuestionText());
        question.setQuestionType(dto.getQuestionType());
        question.setMarks(dto.getMarks());
        question.setExplanation(dto.getExplanation());

        // Remove old options, add new ones
        optionRepository.deleteAll(question.getOptions());
        question.getOptions().clear();

        List<Option> newOptions = dto.getOptions().stream().map(optDto -> Option.builder()
                .optionText(optDto.getOptionText())
                .isCorrect(optDto.isCorrect())
                .question(question)
                .build()).collect(Collectors.toList());
        optionRepository.saveAll(newOptions);
        question.setOptions(newOptions);

        Question updated = questionRepository.save(question);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void deleteQuestion(Long id) {
        if (!questionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Question not found with id: " + id);
        }
        questionRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void bulkUploadQuestions(Long quizId, MultipartFile file) throws IOException {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + quizId));

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.contains("spreadsheet") && !contentType.contains("excel") && !contentType.contains("csv"))) {
            // Try by filename
            String filename = file.getOriginalFilename();
            if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls") && !filename.endsWith(".csv"))) {
                throw new BadRequestException("Invalid file format. Please upload an Excel (.xlsx) or CSV file.");
            }
        }

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            // Row 0 is header, skip it
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String questionText = getCellValue(row, 0);
                String opt1 = getCellValue(row, 1);
                String opt2 = getCellValue(row, 2);
                String opt3 = getCellValue(row, 3);
                String opt4 = getCellValue(row, 4);
                String correctAnswer = getCellValue(row, 5); // A, B, C, or D
                String explanation = getCellValue(row, 6);
                String marksStr = getCellValue(row, 7);

                if (questionText == null || questionText.isEmpty()) continue;

                Question question = Question.builder()
                        .questionText(questionText)
                        .questionType("MCQ")
                        .marks(marksStr != null && !marksStr.isEmpty() ? (int) Double.parseDouble(marksStr) : 1)
                        .explanation(explanation)
                        .quiz(quiz)
                        .options(new ArrayList<>())
                        .build();
                Question savedQ = questionRepository.save(question);

                List<String> opts = Arrays.asList(opt1, opt2, opt3, opt4);
                String[] labels = {"A", "B", "C", "D"};
                for (int j = 0; j < opts.size(); j++) {
                    if (opts.get(j) == null || opts.get(j).isEmpty()) continue;
                    Option option = Option.builder()
                            .optionText(opts.get(j))
                            .isCorrect(labels[j].equalsIgnoreCase(correctAnswer))
                            .question(savedQ)
                            .build();
                    optionRepository.save(option);
                }
            }
        }
    }

    @Override
    public byte[] exportQuestionsTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Questions");
            String[] headers = {"Question Text", "Option A", "Option B", "Option C", "Option D", "Correct Answer (A/B/C/D)", "Explanation", "Marks"};
            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.autoSizeColumn(i);
            }

            // Sample row
            Row sampleRow = sheet.createRow(1);
            sampleRow.createCell(0).setCellValue("What is 2 + 2?");
            sampleRow.createCell(1).setCellValue("3");
            sampleRow.createCell(2).setCellValue("4");
            sampleRow.createCell(3).setCellValue("5");
            sampleRow.createCell(4).setCellValue("6");
            sampleRow.createCell(5).setCellValue("B");
            sampleRow.createCell(6).setCellValue("2 + 2 equals 4");
            sampleRow.createCell(7).setCellValue("1");

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate Excel template", e);
        }
    }

    private String getCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((int) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> null;
        };
    }

    private QuestionDto mapToDto(Question question) {
        QuestionDto dto = new QuestionDto();
        dto.setId(question.getId());
        dto.setQuestionText(question.getQuestionText());
        dto.setQuestionType(question.getQuestionType());
        dto.setMarks(question.getMarks());
        dto.setExplanation(question.getExplanation());
        List<OptionDto> optionDtos = question.getOptions().stream().map(o -> {
            OptionDto odto = new OptionDto();
            odto.setId(o.getId());
            odto.setOptionText(o.getOptionText());
            odto.setCorrect(o.isCorrect());
            return odto;
        }).collect(Collectors.toList());
        dto.setOptions(optionDtos);
        return dto;
    }
}
