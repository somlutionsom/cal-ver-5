/**
 * 이벤트 조회 API (Body 기반)
 * BE/API: Notion에서 이벤트 가져오기
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotionService } from '@/lib/notion';
import { ApiResponse, CalendarEvent, NotionConfig } from '@/lib/types';

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[API /api/events] ${requestId} - 요청 시작`, {
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method
    });
    
    const body = await request.json();
    const { config, startDate, endDate } = body;

    console.log(`[API /api/events] ${requestId} - 요청 파라미터:`, {
      hasConfig: !!config,
      startDate,
      endDate,
      databaseId: config?.dbId,
      dateProperty: config?.dateProp
    });

    if (!config || !startDate || !endDate) {
      console.error(`[API /api/events] ${requestId} - ❌ 필수 파라미터 누락:`, {
        hasConfig: !!config,
        hasStartDate: !!startDate,
        hasEndDate: !!endDate
      });
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'MISSING_PARAMS',
          message: 'Config, startDate, and endDate are required',
        },
      }, { status: 400 });
    }

    const notionConfig: NotionConfig = {
      apiKey: config.token,
      databaseId: config.dbId,
      dateProperty: config.dateProp,
      titleProperty: config.titleProp,
      scheduleProperties: config.scheduleProps, // optional
      importantProperty: config.importantProp,
    };

    console.log(`[API /api/events] ${requestId} - Notion 서비스 호출 시작:`, {
      databaseId: notionConfig.databaseId,
      dateProperty: notionConfig.dateProperty,
      titleProperty: notionConfig.titleProperty,
      importantProperty: notionConfig.importantProperty,
      startDate,
      endDate
    });

    const notionService = new NotionService(notionConfig);
    const result = await notionService.fetchEvents(startDate, endDate);

    if (!result.success) {
      console.error(`[API /api/events] ${requestId} - ❌ Notion API 오류:`, {
        error: result.error,
        config: {
          databaseId: notionConfig.databaseId,
          dateProperty: notionConfig.dateProperty,
          titleProperty: notionConfig.titleProperty
        }
      });
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'NOTION_API_ERROR',
          message: result.error.message,
        },
      }, { status: 500 });
    }

    console.log(`[API /api/events] ${requestId} - ✅ 성공:`, {
      eventCount: result.data.length,
      events: result.data.map(e => ({ date: e.date, title: e.title, isImportant: e.isImportant }))
    });

    return NextResponse.json<ApiResponse<CalendarEvent[]>>({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error(`[API /api/events] ${requestId} - ❌ 예상치 못한 오류:`, {
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

