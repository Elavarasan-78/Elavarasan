package com.smartquiz.portal.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import com.smartquiz.portal.entity.Answer;
import com.smartquiz.portal.entity.QuizAttempt;
import com.smartquiz.portal.entity.Result;
import com.smartquiz.portal.exception.ResourceNotFoundException;
import com.smartquiz.portal.repository.AnswerRepository;
import com.smartquiz.portal.repository.QuizAttemptRepository;
import com.smartquiz.portal.repository.ResultRepository;
import com.smartquiz.portal.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportServiceImpl implements ExportService {

    private final ResultRepository resultRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final AnswerRepository answerRepository;

    @Override
    public List<Result> getAllResults() {
        return resultRepository.findAll();
    }

    @Override
    public List<Result> getResultsByQuiz(Long quizId) {
        return resultRepository.findByQuizId(quizId);
    }

    @Override
    public List<Result> getResultsByUser(Long userId) {
        return resultRepository.findByUserId(userId);
    }

    @Override
    public byte[] exportResultsToExcel(List<Result> results) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Results");
            String[] headers = {"ID", "Student Name", "Username", "Quiz", "Subject", "Score", "Total Marks", "Percentage", "Status", "Date"};
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.autoSizeColumn(i);
            }

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            int rowNum = 1;
            for (Result r : results) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(r.getId());
                row.createCell(1).setCellValue(r.getUser().getFullName());
                row.createCell(2).setCellValue(r.getUser().getUsername());
                row.createCell(3).setCellValue(r.getQuiz().getTitle());
                row.createCell(4).setCellValue(r.getQuiz().getSubject().getName());
                row.createCell(5).setCellValue(r.getScore());
                row.createCell(6).setCellValue(r.getQuiz().getTotalMarks());
                row.createCell(7).setCellValue(Math.round(r.getPercentage() * 100.0) / 100.0 + "%");
                row.createCell(8).setCellValue(r.getStatus());
                row.createCell(9).setCellValue(r.getCreatedAt() != null ? r.getCreatedAt().format(formatter) : "");
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to export results to Excel", e);
        }
    }

    @Override
    public byte[] exportResultToPdf(Long attemptId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found with id: " + attemptId));

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD, new Color(30, 64, 175));
            Font headingFont = new Font(Font.HELVETICA, 14, Font.BOLD, Color.DARK_GRAY);
            Font normalFont = new Font(Font.HELVETICA, 11, Font.NORMAL, Color.BLACK);

            Paragraph title = new Paragraph("Smart Quiz Portal - Result Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            addTableRow(infoTable, "Student Name:", attempt.getUser().getFullName(), headingFont, normalFont);
            addTableRow(infoTable, "Username:", attempt.getUser().getUsername(), headingFont, normalFont);
            addTableRow(infoTable, "Quiz:", attempt.getQuiz().getTitle(), headingFont, normalFont);
            addTableRow(infoTable, "Subject:", attempt.getQuiz().getSubject().getName(), headingFont, normalFont);
            addTableRow(infoTable, "Date:", attempt.getEndTime() != null ? attempt.getEndTime().toString() : "N/A", headingFont, normalFont);
            document.add(infoTable);
            document.add(new Paragraph(" "));

            PdfPTable scoreTable = new PdfPTable(2);
            scoreTable.setWidthPercentage(100);
            addTableRow(scoreTable, "Total Questions:", String.valueOf(attempt.getTotalQuestions()), headingFont, normalFont);
            addTableRow(scoreTable, "Attempted:", String.valueOf(attempt.getAttemptedQuestions()), headingFont, normalFont);
            addTableRow(scoreTable, "Correct Answers:", String.valueOf(attempt.getCorrectAnswers()), headingFont, normalFont);
            addTableRow(scoreTable, "Wrong Answers:", String.valueOf(attempt.getWrongAnswers()), headingFont, normalFont);
            addTableRow(scoreTable, "Marks Obtained:", attempt.getMarksObtained() + " / " + attempt.getQuiz().getTotalMarks(), headingFont, normalFont);
            addTableRow(scoreTable, "Percentage:", String.format("%.2f%%", attempt.getPercentage()), headingFont, normalFont);
            addTableRow(scoreTable, "Status:", attempt.getStatus(), headingFont,
                    "PASSED".equals(attempt.getStatus()) ? new Font(Font.HELVETICA, 11, Font.BOLD, new Color(22, 163, 74)) :
                            new Font(Font.HELVETICA, 11, Font.BOLD, new Color(220, 38, 38)));
            document.add(scoreTable);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }

    private void addTableRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.BOTTOM);
        labelCell.setPadding(6);
        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setBorder(Rectangle.BOTTOM);
        valueCell.setPadding(6);
        table.addCell(labelCell);
        table.addCell(valueCell);
    }
}
