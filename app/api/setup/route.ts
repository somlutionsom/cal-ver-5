/**
 * 설정 저장 API
 * BE/API: 위젯 설정 생성 및 저장
 * 보안: API 키 검증 및 암호화
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateNotionConfig, validateDatabaseId } from '@/lib/validation';
import { NotionService } from '@/lib/notion';
import { WidgetConfig, ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[API /api/setup] ${requestId} - 설정 저장 시작`, {
      timestamp: new Date().toISOString()
    });
    
    // 요청 본문 파싱
    const body = await request.json();
    console.log(`[API /api/setup] ${requestId} - 요청 데이터:`, {
      hasDatabaseId: !!body.databaseId,
      hasApiKey: !!body.apiKey,
      dateProperty: body.dateProperty,
      titleProperty: body.titleProperty
    });
    
    // Notion 설정 검증
    const validationResult = validateNotionConfig(body);
    if (!validationResult.success) {
      console.error(`[API /api/setup] ${requestId} - ❌ 설정 검증 실패:`, {
        error: validationResult.error
      });
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'INVALID_CONFIG',
          message: validationResult.error.message,
        },
      }, { status: 400 });
    }
    
    const notionConfig = validationResult.data;
    console.log(`[API /api/setup] ${requestId} - 설정 검증 성공`);
    
    // Database ID 형식 검증
    if (!validateDatabaseId(notionConfig.databaseId)) {
      console.error(`[API /api/setup] ${requestId} - ❌ Database ID 형식 오류:`, {
        databaseId: notionConfig.databaseId
      });
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'INVALID_DATABASE_ID',
          message: 'Invalid Notion database ID format',
        },
      }, { status: 400 });
    }
    
    // Notion 연결 테스트
    console.log(`[API /api/setup] ${requestId} - Notion 연결 테스트 시작`);
    const notionService = new NotionService(notionConfig);
    const connectionTest = await notionService.testConnection();
    if (!connectionTest.success) {
      console.error(`[API /api/setup] ${requestId} - ❌ Notion 연결 실패:`, {
        error: connectionTest.error
      });
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'CONNECTION_FAILED',
          message: 'Failed to connect to Notion API',
          details: connectionTest.error.message,
        },
      }, { status: 400 });
    }
    console.log(`[API /api/setup] ${requestId} - Notion 연결 성공`);
    
    // 데이터베이스 스키마 검증
    console.log(`[API /api/setup] ${requestId} - 데이터베이스 스키마 검증 시작`);
    const schemaValidation = await notionService.validateDatabase();
    if (!schemaValidation.success) {
      console.error(`[API /api/setup] ${requestId} - ❌ 스키마 검증 실패:`, {
        error: schemaValidation.error
      });
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'INVALID_SCHEMA',
          message: 'Database schema validation failed',
          details: schemaValidation.error.message,
        },
      }, { status: 400 });
    }
    console.log(`[API /api/setup] ${requestId} - 스키마 검증 성공`);
    
    // 위젯 설정 생성
    const widgetConfig: WidgetConfig = {
      id: crypto.randomUUID(),
      notionConfig,
      theme: body.theme || {
        primaryColor: '#4A5568',
        accentColor: '#ED64A6',
        importantColor: '#ED64A6',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // 핵심 정보만 간단하게 인코딩
    const theme = widgetConfig.theme || {
      primaryColor: '#4A5568',
      accentColor: '#ED64A6',
      importantColor: '#ED64A6',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    };
    
    const simpleConfig = {
      token: widgetConfig.notionConfig.apiKey,
      dbId: widgetConfig.notionConfig.databaseId,
      dateProp: widgetConfig.notionConfig.dateProperty,
      titleProp: widgetConfig.notionConfig.titleProperty,
      scheduleProps: widgetConfig.notionConfig.scheduleProperties, // optional
      importantProp: widgetConfig.notionConfig.importantProperty,
      primaryColor: theme.primaryColor,
      accentColor: theme.accentColor,
      importantColor: theme.importantColor,
      backgroundColor: theme.backgroundColor,
      backgroundOpacity: theme.backgroundOpacity,
    };
    
    // Base64 인코딩 (URL-safe)
    const encodedConfig = Buffer.from(JSON.stringify(simpleConfig))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    const embedUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/u/${encodedConfig}`;
    
    // 성공 응답
    console.log(`[API /api/setup] ${requestId} - ✅ 설정 저장 완료:`, {
      configId: encodedConfig.substring(0, 20) + '...',
      embedUrl
    });
    
    return NextResponse.json<ApiResponse<{ configId: string; embedUrl: string }>>({
      success: true,
      data: {
        configId: encodedConfig,
        embedUrl,
      },
    });
    
  } catch (error) {
    console.error(`[API /api/setup] ${requestId} - ❌ 예상치 못한 오류:`, {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

