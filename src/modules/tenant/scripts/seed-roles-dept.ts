import { DataSource } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Department } from '../entities/department.entity';

export async function seedRoleAndDept(connection: DataSource) {
  const roleRepo = connection.getRepository(Role);

  const deptRepo = connection.getRepository(Department);

  const defaultRoles = [
    'bakery manager',
    'production supervisor',
    'sales manager',
    'accountant',
  ];

  const defaultDepartments = ['production', 'sales', 'accounting'];

  for (const roleName of defaultRoles) {
    const normalized = roleName.toLowerCase().trim();
    const exists = await roleRepo.findOne({
      where: { name: normalized },
    });
    if (!exists) {
      await roleRepo.save(roleRepo.create({ name: normalized }));
    }
  }

  for (const deptName of defaultDepartments) {
    const normalized = deptName.toLowerCase().trim();
    const exists = await deptRepo.findOne({
      where: { name: normalized },
    });
    if (!exists) {
      await deptRepo.save(deptRepo.create({ name: normalized }));
    }
  }
}
