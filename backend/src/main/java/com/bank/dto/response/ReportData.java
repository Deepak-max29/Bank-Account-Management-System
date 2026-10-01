package com.bank.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportData {
    private String reportType;
    private String title;
    private LocalDateTime generatedAt;
    private List<String> headers;
    private List<Map<String, Object>> rows;
    
    // Constructor used by ReportServiceImpl (2 args)
    public ReportData(List<String> headers, List<Map<String, Object>> rows) {
        this.headers = headers;
        this.rows = rows;
    }
}