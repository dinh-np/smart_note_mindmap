```markdown
# SKILL: MINDGENIUS (.MGMX) TWO-WAY PARSER & BUILDER

## 1. Overview & File Specifications
- **Format Identity:** MindGenius `.mgmx` format is a compressed ZIP package enclosing a core `Document.xml` manifest and branch tree[cite: 1, 11].
- **Core Libraries:** `jszip` (v3+) + `fast-xml-parser` (v4+).
- **Encoding Rule:** UTF-8 encoding MUST be strictly applied to preserve 100% of Vietnamese diacritics without character corruption[cite: 1, 9].

## 2. Import Pipeline (`.mgmx` -> `MindNode`)
1. **Unzip Archive Client-Side:**
   - Read file buffer with `JSZip.loadAsync(fileBlob)`.
   - Extract string contents of `Document.xml` using `.async("text")`[cite: 1, 11].
2. **XML Deserialization:**
   - Initialize `XMLParser` with options:
     ```typescript
     const parser = new XMLParser({
       ignoreAttributes: false,
       attributeNamePrefix: '@_',
       textNodeName: '#text',
       trimValues: true,
     });
     const parsed = parser.parse(xmlContent);
     ```
3. **Recursive Tree Traversal (`<Branches>` -> `<Branch>`):**
   - Map `<Branch @_Title="...">` or inner `<Title>` to `MindNode.topic`[cite: 1, 11].
   - Map `<Notes>` / `<Description>` to `MindNode.description`[cite: 1, 9].
   - Map `<TaskInformation>` attributes:
     - `StartDate` -> `MindNode.task.startDate` (convert to `YYYY-MM-DD`)[cite: 1, 9].
     - `DueDate` -> `MindNode.task.endDate`[cite: 1, 9].
     - `Duration` -> `MindNode.task.duration`[cite: 1, 9].
     - `PercentComplete` -> `MindNode.task.progress`[cite: 1, 9].
     - `Resource` -> `MindNode.task.assignee`[cite: 1, 9].
   - Map `<Style>` color codes to `MindNode.color`[cite: 1, 9].
4. **Persistence:**
   - Save transformed `MindMapRecord` directly to `SmartNoteMindmapDB` (Dexie.js)[cite: 9].
   - Trigger canvas camera auto-centering (`toCenter()`).

## 3. Export Pipeline (`MindNode` -> `.mgmx`)
1. **Tree Serialization:**
   - Read current `MindNode` from state or Dexie.js[cite: 9].
   - Convert `MindNode` tree into a compliant MindGenius XML structure:
     ```xml
     <?xml version="1.0" encoding="utf-8"?>
     <MindGeniusDocument Version="10.0">
       <DocumentProperties>
         <Title>{mapTitle}</Title>
         <Author>Smart Note Mindmap PWA</Author>
       </DocumentProperties>
       <Map>
         <RootBranch Title="{rootData.topic}">
           <!-- Recursively nested <Branch> tags -->
         </RootBranch>
       </Map>
     </MindGeniusDocument>
     ```
2. **ZIP Packaging:**
   - Instantiate `const zip = new JSZip()`.
   - Add `Document.xml` with explicit UTF-8 encoding[cite: 1, 9].
   - Generate compressed Blob: `zip.generateAsync({ type: "blob", mimeType: "application/zip", compression: "DEFLATE" })`.
3. **Delivery & Platform Fallback:**
   - **Desktop / Android:** Trigger `<a download="{title}.mgmx">`[cite: 1, 9].
   - **iOS Safari:** Invoke `navigator.share({ files: [file], title })` via Web Share API to circumvent iOS sandbox download blocking[cite: 1, 9].
   