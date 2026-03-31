export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const rowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  dob: z.string().min(1, "Date of birth is required"),
  branch: z.string().min(1, "Branch is required"),
  cake_preference: z
    .enum(["EGGLESS", "EGG", "VEGAN", "SUGAR_FREE", "DEFAULT", "eggless", "egg", "vegan", "sugar_free", "default", ""])
    .optional()
    .default("DEFAULT"),
});

function parseDate(dateStr: string): Date | null {
  // Try multiple date formats
  const formats = [
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ];

  for (let i = 0; i < formats.length; i++) {
    const match = dateStr.match(formats[i]);
    if (match) {
      let year: number, month: number, day: number;
      if (i === 0) {
        // YYYY-MM-DD
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else {
        // DD/MM/YYYY or DD-MM-YYYY
        day = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        year = parseInt(match[3]);
      }
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
        return d;
      }
    }
  }

  // Fallback to native parsing
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await request.json();

    if (!Array.isArray(body.rows)) {
      return NextResponse.json(
        { error: "Expected an array of rows" },
        { status: 400 }
      );
    }

    const rows: any[] = body.rows;
    const errors: { row: number; field: string; message: string }[] = [];
    const validRows: {
      name: string;
      email: string | null;
      dateOfBirth: Date;
      branchId: string;
      cakePreference: string;
    }[] = [];

    // Fetch branches for this company
    const branches = await prisma.branch.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true },
    });

    const branchMap = new Map(
      branches.map((b) => [b.name.toLowerCase().trim(), b.id])
    );

    // Fetch existing employee emails for duplicate checking
    const existingEmployees = await prisma.employee.findMany({
      where: { companyId, isActive: true, email: { not: null } },
      select: { email: true },
    });
    const existingEmails = new Set(
      existingEmployees.map((e) => e.email!.toLowerCase())
    );

    const uploadEmails = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 1;
      const row = rows[i];

      // Validate with zod
      const validation = rowSchema.safeParse(row);
      if (!validation.success) {
        for (const err of validation.error.errors) {
          errors.push({
            row: rowNum,
            field: err.path.join(".") || "unknown",
            message: err.message,
          });
        }
        continue;
      }

      const data = validation.data;

      // Validate date
      const parsedDate = parseDate(data.dob);
      if (!parsedDate) {
        errors.push({
          row: rowNum,
          field: "dob",
          message: "Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY",
        });
        continue;
      }

      // Validate branch
      const branchId = branchMap.get(data.branch.toLowerCase().trim());
      if (!branchId) {
        errors.push({
          row: rowNum,
          field: "branch",
          message: `Branch "${data.branch}" not found. Available: ${branches.map((b) => b.name).join(", ")}`,
        });
        continue;
      }

      // Check for duplicate email
      const email = data.email?.trim() || "";
      if (email) {
        const emailLower = email.toLowerCase();
        if (existingEmails.has(emailLower)) {
          errors.push({
            row: rowNum,
            field: "email",
            message: `Employee with email "${email}" already exists`,
          });
          continue;
        }
        if (uploadEmails.has(emailLower)) {
          errors.push({
            row: rowNum,
            field: "email",
            message: `Duplicate email "${email}" in upload`,
          });
          continue;
        }
        uploadEmails.add(emailLower);
      }

      const preference = (data.cake_preference || "DEFAULT").toUpperCase();

      validRows.push({
        name: data.name.trim(),
        email: email || null,
        dateOfBirth: parsedDate,
        branchId,
        cakePreference: preference,
      });
    }

    // Bulk create in a transaction
    let created = 0;
    if (validRows.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const row of validRows) {
          await tx.employee.create({
            data: {
              name: row.name,
              email: row.email,
              dateOfBirth: row.dateOfBirth,
              branchId: row.branchId,
              companyId,
              cakePreference: row.cakePreference as any,
            },
          });
          created++;
        }
      });
    }

    return NextResponse.json({
      created,
      errors,
      total: rows.length,
    });
  } catch (error) {
    console.error("POST /api/employees/upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
