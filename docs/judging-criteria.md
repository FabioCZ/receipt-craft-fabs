# Judging Criteria

Your submission will be evaluated based on the following criteria:

## 1. Creativity (25 points)
- **Unique JSON DSL Design** (10 pts)
  - Innovative structure and organization
  - Extensibility and flexibility
  - Clear and intuitive format
  
- **Receipt Features** (10 pts)
  - Creative use of available printer capabilities
  - Interesting layout designs
  - Novel element combinations
  
- **User Experience** (5 pts)
  - Intuitive drag-and-drop interface
  - Clear visual feedback
  - Smooth workflow

## 2. Completeness (25 points)
- **Frontend Implementation** (10 pts)
  - All element types supported
  - Properties editing works correctly
  - JSON generation is accurate
  
- **Kotlin Interpreter** (10 pts)
  - Correctly parses JSON DSL
  - All element types handled
  - Dynamic fields resolved
  
- **Integration** (5 pts)
  - Successful upload to server
  - Test printing works
  - End-to-end flow complete

## 3. Robustness (25 points)
- **Error Handling** (10 pts)
  - Graceful handling of invalid JSON
  - Unknown element types don't crash
  - Missing/null values handled properly
  
- **Edge Cases** (10 pts)
  - Empty receipts
  - Very long text
  - Special characters
  - Large numbers of elements
  
- **Validation** (5 pts)
  - Input validation in designer
  - JSON structure validation
  - Printer command validation

## 4. Print Quality (25 points)
- **Layout Accuracy** (10 pts)
  - Elements render as designed
  - Spacing and alignment correct
  - Consistent formatting
  
- **Print Features** (10 pts)
  - Barcodes scan correctly
  - QR codes work
  - Text is legible
  - Images render properly
  
- **Professional Appearance** (5 pts)
  - Receipt looks professional
  - Good use of styling
  - Clean and organized layout

## Bonus Points (up to 10 extra)
- **Advanced Features**
  - Conditional elements
  - Templates/presets
  - Multi-language support
  - Custom fonts or graphics
  
- **Performance**
  - Fast JSON parsing
  - Efficient printer commands
  - Optimized rendering
  
- **Documentation**
  - Clear code comments
  - Usage instructions
  - API documentation

## Testing Process

### Phase 1: Design Review (10 minutes)
1. Team demonstrates their visual designer
2. Shows JSON generation for various layouts
3. Explains their DSL design choices

### Phase 2: Interpreter Testing (10 minutes)
1. Upload Kotlin interpreter to server
2. Test with team's own designs
3. Test with standard test cases:
   - Simple text receipt
   - Receipt with all element types
   - Receipt with dynamic fields
   - Edge case receipt

### Phase 3: Live Printing (5 minutes)
1. Enable real printer for team
2. Print team's best design
3. Print judge's challenge receipt
4. Verify barcode/QR functionality

## Submission Requirements

✅ **Must Have:**
- Working visual designer that generates JSON
- Kotlin interpreter that processes the JSON
- Successful upload to server
- At least one successful test print

❌ **Disqualifications:**
- Code that crashes the server
- Malicious or inappropriate content
- Plagiarized code
- Failure to upload interpreter

## Tips for Success

1. **Start Simple**: Get basic text working first, then add features
2. **Test Often**: Use the mock printer extensively before submission
3. **Handle Errors**: Don't let one bad element ruin the entire receipt
4. **Be Creative**: Think beyond basic receipts - loyalty programs, coupons, surveys
5. **Document Your Format**: Clear JSON structure helps debugging

## Sample Score Sheet

```
Team: ___________________

Creativity:         ___/25
- DSL Design:       ___/10
- Features:         ___/10
- UX:              ___/5

Completeness:       ___/25
- Frontend:         ___/10
- Interpreter:      ___/10
- Integration:      ___/5

Robustness:         ___/25
- Error Handling:   ___/10
- Edge Cases:       ___/10
- Validation:       ___/5

Print Quality:      ___/25
- Accuracy:         ___/10
- Features:         ___/10
- Appearance:       ___/5

Bonus:              ___/10

TOTAL:              ___/100 (+bonus)

Notes:
_________________________________
_________________________________
_________________________________
```

Good luck! We're excited to see your creative solutions!