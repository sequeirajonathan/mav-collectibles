import { NextResponse } from 'next/server';
import { prisma } from '@lib/prisma';
import { printJobSchema } from '@validations/print-job';
import { z } from 'zod';

export async function GET() {
  try {
    const printJobs = await prisma.printJob.findMany({
      orderBy: { created_at: 'desc' },
    });
    
    return NextResponse.json(printJobs);
  } catch (error) {
    console.error('Error fetching print jobs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch print jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = printJobSchema.parse(body);
    
    const newPrintJob = await prisma.printJob.create({
      data: validatedData,
    });
    
    return NextResponse.json(newPrintJob, { status: 201 });
  } catch (error) {
    console.error('Error creating print job:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create print job' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const validatedData = printJobSchema.partial().parse(data);
    
    const updatedPrintJob = await prisma.printJob.update({
      where: { id },
      data: validatedData,
    });
    
    return NextResponse.json(updatedPrintJob);
  } catch (error) {
    console.error('Error updating print job:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update print job' },
      { status: 500 }
    );
  }
} 