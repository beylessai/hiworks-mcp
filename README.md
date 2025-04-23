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

## 서버 설정

기본적으로 다음 서버 설정을 사용합니다:

- POP3: pop3s.hiworks.com:995 (SSL)
- SMTP: smtps.hiworks.com:465 (SSL/TLS)

## 주의사항

- 계정 정보는 안전하게 관리해주세요.
- 대량 메일 발송 시 하이웍스의 정책을 준수해주세요.
- 메일 조회 시 서버 부하를 고려하여 적절한 limit 값을 설정해주세요. 