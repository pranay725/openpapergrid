# Screening Configurations System

## Overview

The screening configurations system allows users to customize which fields are extracted from research papers using AI. Users can choose from preset configurations, create their own, or share configurations with the community.

## Database Schema

### Tables

#### `screening_configurations`
Stores configuration templates that define which fields to extract from papers.

- **id**: UUID (primary key)
- **name**: Text - Name of the configuration
- **description**: Text - Description of what this configuration is for
- **visibility**: Enum - `default` (system presets), `community` (shared), `private` (user's own)
- **user_id**: UUID - Owner of the configuration (null for default configs)
- **fields**: JSONB - Array of field definitions
- **is_active**: Boolean - Whether this config is active
- **created_at**: Timestamp
- **updated_at**: Timestamp

#### `user_active_configuration`
Tracks which configuration each user is currently using.

- **user_id**: UUID (primary key) - The user
- **configuration_id**: UUID - The active configuration
- **updated_at**: Timestamp

#### `papers`
Stores research papers uploaded by users.

- **id**: UUID (primary key)
- **user_id**: UUID - Owner of the paper
- **title**: Text - Paper title
- **abstract**: Text - Paper abstract
- **authors**: Text[] - Array of author names
- **publication_date**: Date
- **journal**: Text
- **doi**: Text - Digital Object Identifier
- **pmid**: Text - PubMed ID
- **url**: Text - URL to the paper
- **full_text**: Text - Full text content
- **status**: Text - Processing status (pending, processing, done, error)
- **created_at**: Timestamp
- **updated_at**: Timestamp

#### `paper_field_values`
Stores AI-extracted values for each field from each paper.

- **id**: UUID (primary key)
- **paper_id**: UUID - The paper this value belongs to
- **field_id**: Text - ID of the field from the configuration
- **field_name**: Text - Name of the field
- **field_type**: Enum - Type of the field (text, number, select, etc.)
- **value**: JSONB - The extracted value
- **confidence**: Text - Extraction confidence (high, medium, low, unknown)
- **citations**: JSONB - Array of text citations supporting the extraction
- **extracted_at**: Timestamp
- **updated_at**: Timestamp

### Field Schema

Each field in a configuration has this structure:

```json
{
  "id": "unique_field_id",
  "name": "Display Name",
  "type": "text|number|select|multi_select|boolean|date|url",
  "enabled": true,
  "isAI": true,
  "prompt": "AI prompt to extract this field",
  "options": ["option1", "option2"] // For select/multi_select types
}
```

### Field Types

- **text**: Free text field
- **number**: Numeric value
- **select**: Single choice from options
- **multi_select**: Multiple choices from options
- **boolean**: Yes/No field
- **date**: Date field
- **url**: URL field

## Default Configurations

### Basic Screening
Essential fields for initial paper screening:
- Paper Type (select)
- Key Objective (text)
- Key Finding (text)

### Clinical Trial Screening
Comprehensive fields for screening clinical trial papers:
- Clinical Trial (boolean)
- Study Size (number)
- Study Type (select)
- Disease Area (multi_select)
- Primary Endpoint (text)
- Results (text)

### Literature Review
Fields optimized for systematic reviews and meta-analyses:
- Review Type (select)
- Papers Included (number)
- Databases Searched (multi_select)
- Quality Assessment Tool (text)
- Main Conclusion (text)

## Row Level Security

All tables have RLS enabled:

- **screening_configurations**: 
  - Everyone can view default and community configs
  - Users can only create/update/delete their own configs
  
- **user_active_configuration**:
  - Users can only view/modify their own active config
  
- **papers**:
  - Users can only view/modify their own papers
  
- **paper_field_values**:
  - Users can only view/modify values for their own papers

## Usage Flow

1. User selects a configuration (default, community, or creates their own)
2. Configuration is set as their active configuration
3. When papers are uploaded, the system extracts values for all enabled fields
4. Extracted values are stored with confidence scores and citations
5. Users can edit extracted values manually if needed

## API Integration

The frontend should:
1. Fetch available configurations on load
2. Load user's active configuration
3. Save configuration changes to the database
4. Fetch extracted field values for displayed papers
5. Allow inline editing of extracted values 