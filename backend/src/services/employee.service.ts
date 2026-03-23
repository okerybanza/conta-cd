import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { CustomError } from '../middleware/error.middleware';
import { eventBus } from '../events/event-bus';
import { EmployeeCreated, EmployeeUpdated, EmployeeTerminated } from '../events/domain-event';

export interface CreateEmployeeData {
  employeeNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  dateOfBirth?: Date | string;
  gender?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  position?: string;
  department?: string;
  hireDate?: Date | string;
  terminationDate?: Date | string;
  employmentType?: string;
  status?: string;
  baseSalary?: number;
  currency?: string;
  salaryFrequency?: string;
  bankAccount?: string;
  bankName?: string;
  nif?: string;
  socialSecurityNumber?: string;
  notes?: string;
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  position?: string;
  page?: number;
  limit?: number;
}

export class EmployeeService {
  // Créer un employé (DOC-04 : architecture événementielle)
  async create(companyId: string, data: CreateEmployeeData, userId?: string) {
    // Vérifier que le numéro d'employé est unique
    const existing = await prisma.employees.findFirst({
      where: {
        company_id: companyId,
        employee_number: data.employeeNumber,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new CustomError(
        `Un employé avec le numéro ${data.employeeNumber} existe déjà`,
        400,
        'EMPLOYEE_NUMBER_EXISTS'
      );
    }

    const employee = await prisma.employees.create({
      data: {
        id: `employee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        company_id: companyId,
        employee_number: data.employeeNumber,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        mobile: data.mobile,
        date_of_birth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        address: data.address,
        city: data.city,
        country: data.country || 'RDC',
        postal_code: data.postalCode,
        position: data.position,
        department: data.department,
        hire_date: new Date(data.hireDate),
        termination_date: data.terminationDate ? new Date(data.terminationDate) : null,
        employment_type: data.employmentType || 'full_time',
        status: data.status || 'active',
        base_salary: new Prisma.Decimal(data.baseSalary),
        currency: data.currency || 'CDF',
        salary_frequency: data.salaryFrequency || 'monthly',
        bank_account: data.bankAccount,
        bank_name: data.bankName,
        nif: data.nif,
        social_security_number: data.socialSecurityNumber,
        notes: data.notes,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Publier l'événement (DOC-04)
    const event = new EmployeeCreated(
      employee.id,
      employee.employee_number,
      companyId,
      { userId, companyId, timestamp: new Date() } as any
    );
    eventBus.publish(event);

    logger.info(`Employee created: ${employee.id}`, { companyId, employeeId: employee.id });
    return employee;
  }

  // Obtenir un employé par ID
  async getById(companyId: string, employeeId: string) {
    const employee = await prisma.employees.findFirst({
      where: {
        id: employeeId as any,
        company_id: companyId,
        deleted_at: null,
      },
      include: {
        attendances: {
          take: 10,
          orderBy: {
            date: 'desc',
          },
        },
        payrolls: {
          take: 5,
          orderBy: {
            period_start: 'desc',
          },
          include: {
            payroll_items: true,
          },
        },
        employee_contracts: {
          where: {
            status: 'active',
            deleted_at: null,
          },
          orderBy: {
            start_date: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!employee) {
      throw new CustomError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
    }

    return employee;
  }

  // Lister les employés
  async list(companyId: string, filters: EmployeeFilters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.employeesWhereInput = {
      company_id: companyId,
      deleted_at: null,
      ...(filters.search && {
        OR: [
          { first_name: { contains: filters.search, mode: 'insensitive' } },
          { last_name: { contains: filters.search, mode: 'insensitive' } },
          { employee_number: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { position: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters.department && { department: filters.department }),
      ...(filters.status && { status: filters.status }),
      ...(filters.position && { position: filters.position }),
    };

    const [employees, total] = await Promise.all([
      prisma.employees.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
      }),
      prisma.employees.count({ where }),
    ]);

    return {
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Mettre à jour un employé (DOC-04 : architecture événementielle)
  async update(companyId: string, employeeId: string, data: UpdateEmployeeData, userId?: string) {
    const employee = await this.getById(companyId, employeeId);

    const updateData: Prisma.employeesUpdateInput = {};
    const changes: Record<string, any> = {};

    if (data.firstName !== undefined) {
      updateData.first_name = data.firstName;
      changes.firstName = { old: employee.first_name, new: data.firstName };
    }
    if (data.lastName !== undefined) {
      updateData.last_name = data.lastName;
      changes.lastName = { old: employee.last_name, new: data.lastName };
    }
    if (data.email !== undefined) {
      updateData.email = data.email;
      changes.email = { old: employee.email, new: data.email };
    }
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.mobile !== undefined) updateData.mobile = data.mobile;
    if (data.dateOfBirth !== undefined) updateData.date_of_birth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.postalCode !== undefined) updateData.postal_code = data.postalCode;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.hireDate !== undefined) updateData.hire_date = new Date(data.hireDate);
    if (data.terminationDate !== undefined) {
      updateData.termination_date = data.terminationDate ? new Date(data.terminationDate) : null;
      if (data.terminationDate) {
        // Si date de sortie définie, publier événement de sortie
        const terminationEvent = new (EmployeeTerminated as any)(
          employeeId,
          new Date(data.terminationDate),
          undefined,
          { userId, companyId, timestamp: new Date() } as any
        );
        eventBus.publish(terminationEvent);
      }
    }
    if (data.employmentType !== undefined) updateData.employment_type = data.employmentType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.baseSalary !== undefined) updateData.base_salary = new Prisma.Decimal(data.baseSalary);
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.salaryFrequency !== undefined) updateData.salary_frequency = data.salaryFrequency;
    if (data.bankAccount !== undefined) updateData.bank_account = data.bankAccount;
    if (data.bankName !== undefined) updateData.bank_name = data.bankName;
    if (data.nif !== undefined) updateData.nif = data.nif;
    if (data.socialSecurityNumber !== undefined) updateData.social_security_number = data.socialSecurityNumber;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Vérifier l'unicité du numéro d'employé si modifié
    if (data.employeeNumber && data.employeeNumber !== employee.employee_number) {
      const existing = await prisma.employees.findFirst({
        where: {
          company_id: companyId,
          employee_number: data.employeeNumber,
          deleted_at: null,
          id: { not: employeeId },
        },
      });

      if (existing) {
        throw new CustomError(
          `Un employé avec le numéro ${data.employeeNumber} existe déjà`,
          400,
          'EMPLOYEE_NUMBER_EXISTS'
        );
      }

      updateData.employee_number = data.employeeNumber;
      changes.employeeNumber = { old: employee.employee_number, new: data.employeeNumber };
    }

    const updated = await prisma.employees.update({
      where: { id: employeeId },
      data: updateData,
    });

    // Publier l'événement de mise à jour (DOC-04)
    if (Object.keys(changes).length > 0) {
      const event = new EmployeeUpdated(
        employeeId as any,
        changes as any,
        { userId, companyId, timestamp: new Date() } as any
      );
      eventBus.publish(event);
    }

    logger.info(`Employee updated: ${employeeId}`, { companyId, employeeId });
    return updated;
  }

  // Supprimer un employé (soft delete) - DOC-04 : aucune suppression physique
  async delete(companyId: string, employeeId: string, userId?: string) {
    const employee = await this.getById(companyId, employeeId);

    // Publier événement de sortie avant suppression logique
    const terminationEvent = new (EmployeeTerminated as any)(
      employeeId,
      new Date(),
      'Suppression demandée',
      { userId, companyId, timestamp: new Date() } as any
    );
    eventBus.publish(terminationEvent);

    await prisma.employees.update({
      where: { id: employeeId },
      data: {
        deleted_at: new Date(),
        status: 'terminated',
        termination_date: new Date(),
      },
    });

    logger.info(`Employee deleted: ${employeeId}`, { companyId, employeeId });
    return { success: true };
  }
}

export default new EmployeeService();

