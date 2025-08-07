import { NextRequest, NextResponse } from 'next/server';
import googleTrends from 'google-trends-api';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const requestData = await request.json();
    const { idea } = requestData;

    // Validate input
    if (!idea || typeof idea !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Missing or invalid idea field'
      }, { status: 400 });
    }

    // Calculate date range for past 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Fetch Google Trends interest over time
    const response = await googleTrends.interestOverTime({
      keyword: idea,
      startTime: startDate,
      endTime: endDate,
      geo: '', // Worldwide
      hl: 'en-US'
    });

    // Parse the response
    const data = JSON.parse(response);
    
    if (!data.default || !data.default.timelineData || !Array.isArray(data.default.timelineData)) {
      console.error('Invalid Google Trends response structure');
      return NextResponse.json({
        success: false,
        error: 'Invalid response from Google Trends API'
      }, { status: 500 });
    }

    // Get the latest score (last data point)
    const timelineData = data.default.timelineData;
    const latestDataPoint = timelineData[timelineData.length - 1];
    
    if (!latestDataPoint || typeof latestDataPoint.value[0] !== 'number') {
      console.error('No valid data points found in Google Trends response');
      return NextResponse.json({
        success: false,
        error: 'No valid data points found'
      }, { status: 500 });
    }

    const googleTrendScore = latestDataPoint.value[0];

    return NextResponse.json({
      success: true,
      googleTrendScore
    });

  } catch (error) {
    console.error('Error fetching Google Trends data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Google Trends data'
    }, { status: 500 });
  }
}
