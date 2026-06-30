import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Retrieve teacher settings. If they don't exist yet, initialize them with defaults.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherUserId = searchParams.get('teacherUserId');

    if (!teacherUserId) {
      return NextResponse.json(
        { error: 'teacherUserId is required' },
        { status: 400 }
      );
    }

    // Find the teacher
    let teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });

    // Fallback to first teacher for demo/local testing if needed
    if (!teacher) {
      teacher = await prisma.teacher.findFirst();
    }

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Find or create settings
    let setting = await prisma.teacherSetting.findUnique({
      where: { teacherId: teacher.id },
    });

    if (!setting) {
      setting = await prisma.teacherSetting.create({
        data: {
          teacherId: teacher.id,
        },
      });
    }

    return NextResponse.json({ settings: setting });
  } catch (error: any) {
    console.error('Error fetching teacher settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Save or update teacher settings
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      teacherUserId,
      preTestLimitMult,
      preTestLimitDiv,
      practiceLimitMult,
      practiceLimitDiv,
      postTestLimitMult,
      postTestLimitDiv,
      preTestTimeMult,
      preTestTimeDiv,
      practiceTimeMult,
      practiceTimeDiv,
      postTestTimeMult,
      postTestTimeDiv,
    } = body;

    if (!teacherUserId) {
      return NextResponse.json(
        { error: 'teacherUserId is required' },
        { status: 400 }
      );
    }

    // Find the teacher
    let teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacher) {
      teacher = await prisma.teacher.findFirst();
    }

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Upsert the settings
    const setting = await prisma.teacherSetting.upsert({
      where: { teacherId: teacher.id },
      update: {
        preTestLimitMult: preTestLimitMult !== undefined ? Number(preTestLimitMult) : undefined,
        preTestLimitDiv: preTestLimitDiv !== undefined ? Number(preTestLimitDiv) : undefined,
        practiceLimitMult: practiceLimitMult !== undefined ? Number(practiceLimitMult) : undefined,
        practiceLimitDiv: practiceLimitDiv !== undefined ? Number(practiceLimitDiv) : undefined,
        postTestLimitMult: postTestLimitMult !== undefined ? Number(postTestLimitMult) : undefined,
        postTestLimitDiv: postTestLimitDiv !== undefined ? Number(postTestLimitDiv) : undefined,
        preTestTimeMult: preTestTimeMult !== undefined ? Number(preTestTimeMult) : undefined,
        preTestTimeDiv: preTestTimeDiv !== undefined ? Number(preTestTimeDiv) : undefined,
        practiceTimeMult: practiceTimeMult !== undefined ? Number(practiceTimeMult) : undefined,
        practiceTimeDiv: practiceTimeDiv !== undefined ? Number(practiceTimeDiv) : undefined,
        postTestTimeMult: postTestTimeMult !== undefined ? Number(postTestTimeMult) : undefined,
        postTestTimeDiv: postTestTimeDiv !== undefined ? Number(postTestTimeDiv) : undefined,
      },
      create: {
        teacherId: teacher.id,
        preTestLimitMult: preTestLimitMult !== undefined ? Number(preTestLimitMult) : 10,
        preTestLimitDiv: preTestLimitDiv !== undefined ? Number(preTestLimitDiv) : 10,
        practiceLimitMult: practiceLimitMult !== undefined ? Number(practiceLimitMult) : 10,
        practiceLimitDiv: practiceLimitDiv !== undefined ? Number(practiceLimitDiv) : 10,
        postTestLimitMult: postTestLimitMult !== undefined ? Number(postTestLimitMult) : 10,
        postTestLimitDiv: postTestLimitDiv !== undefined ? Number(postTestLimitDiv) : 10,
        preTestTimeMult: preTestTimeMult !== undefined ? Number(preTestTimeMult) : 5,
        preTestTimeDiv: preTestTimeDiv !== undefined ? Number(preTestTimeDiv) : 5,
        practiceTimeMult: practiceTimeMult !== undefined ? Number(practiceTimeMult) : 0,
        practiceTimeDiv: practiceTimeDiv !== undefined ? Number(practiceTimeDiv) : 0,
        postTestTimeMult: postTestTimeMult !== undefined ? Number(postTestTimeMult) : 5,
        postTestTimeDiv: postTestTimeDiv !== undefined ? Number(postTestTimeDiv) : 5,
      },
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: setting,
    });
  } catch (error: any) {
    console.error('Error saving teacher settings:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
