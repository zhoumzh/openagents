import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    launcherVersion: process.env.LAUNCHER_VERSION || '0.7.1',
  });
}
