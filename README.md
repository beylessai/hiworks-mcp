# Hiworks Mail MCP

하이웍스 메일 시스템과 연동하여 메일 조회 및 전송을 할 수 있는 MCP(Model Context Protocol) 서버입니다.

## MCP 설정

Cursor의 MCP 설정 파일(`~/.cursor/mcp.json`)에 다음 내용을 추가합니다:

```json
{
  "mcpServers": {
    "hiworks-mail-mcp": {
      "command": "npx",
      "args": ["-y", "hiworks-mail-mcp@latest"],
      "env": {
        "HIWORKS_USERNAME": "your.email@beyless.com",
        "HIWORKS_PASSWORD": "your_password"
      }
    }
  }
}
```

- `HIWORKS_USERNAME`: 하이웍스 이메일 주소
- `HIWORKS_PASSWORD`: 하이웍스 계정 비밀번호

## 기능

### 1. 메일 검색
```typescript
// 최근 메일 10개 조회
{
  "limit": 10
}

// 특정 키워드로 검색
{
  "query": "회의",
  "limit": 5
}
```

### 2. 메일 읽기
```typescript
{
  "messageId": "message_id_here"
}
```

### 3. 메일 전송
```typescript
// 기본 텍스트 메일
{
  "to": "recipient@example.com",
  "subject": "테스트 메일",
  "text": "안녕하세요, 테스트 메일입니다."
}

// HTML 메일 + CC
{
  "to": "recipient@example.com",
  "subject": "HTML 테스트",
  "html": "<h1>안녕하세요</h1><p>HTML 테스트 메일입니다.</p>",
  "cc": ["cc1@example.com", "cc2@example.com"]
}

// 첨부 파일 포함
{
  "to": "recipient@example.com",
  "subject": "첨부 파일 테스트",
  "text": "첨부 파일이 포함된 메일입니다.",
  "attachments": [
    {
      "filename": "test.txt",
      "content": "파일 내용"
    }
  ]
}
```

## 서버 설정

기본적으로 다음 서버 설정을 사용합니다:

- POP3: pop3s.hiworks.com:995 (SSL)
- SMTP: smtps.hiworks.com:465 (SSL/TLS)

## 주의사항

- 계정 정보는 안전하게 관리해주세요.
- 대량 메일 발송 시 하이웍스의 정책을 준수해주세요.
- 메일 조회 시 서버 부하를 고려하여 적절한 limit 값을 설정해주세요. 