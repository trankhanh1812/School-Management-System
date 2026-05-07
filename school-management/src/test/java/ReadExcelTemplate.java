import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import java.io.FileInputStream;

public class ReadExcelTemplate {
    public static void main(String[] args) throws Exception {
        String filePath = "src/main/resources/templates/student_import_template_vn 1.xlsx";
        try (FileInputStream fis = new FileInputStream(filePath);
             XSSFWorkbook workbook = new XSSFWorkbook(fis)) {
            
            for (int sheetIndex = 0; sheetIndex < workbook.getNumberOfSheets(); sheetIndex++) {
                Sheet sheet = workbook.getSheetAt(sheetIndex);
                System.out.println("\n=== Sheet: " + sheet.getSheetName() + " ===");
                
                Row headerRow = sheet.getRow(0);
                if (headerRow != null) {
                    System.out.print("Columns: ");
                    for (int col = 0; col < headerRow.getLastCellNum(); col++) {
                        String cellValue = headerRow.getCell(col) != null ? 
                            headerRow.getCell(col).getStringCellValue() : "";
                        System.out.print(cellValue + " | ");
                    }
                    System.out.println();
                    System.out.println("Total rows: " + sheet.getLastRowNum());
                }
            }
        }
    }
}
