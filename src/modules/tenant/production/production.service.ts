// src/modules/tenant/production/production.service.ts
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CONNECTION } from 'src/modules/tenancy/tenancy.symbol';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { Recipe } from '../entities/recipe.entity';
import { ProductionConfig } from '../entities/production-config.entity';
import { ProductionShift, ShiftStatus } from '../entities/production-shift.entity';
import { ProductionShiftMaterial } from '../entities/production-shift-material.entity';
import { User } from '../entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateRawMaterialDto } from './dto/create-raw-material.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/create-recipe.dto';
import {
  CreateProductionConfigDto,
  UpdateProductionConfigDto,
} from './dto/create-production-config.dto';
import {
  AbortShiftDto,
  CompleteShiftDto,
  CreateProductionShiftDto,
} from './dto/create-production-shift.dto';

@Injectable()
export class ProductionService {
  private readonly productRepo: Repository<Product>;
  private readonly rawMaterialRepo: Repository<RawMaterial>;
  private readonly recipeRepo: Repository<Recipe>;
  private readonly configRepo: Repository<ProductionConfig>;
  private readonly shiftRepo: Repository<ProductionShift>;
  private readonly shiftMaterialRepo: Repository<ProductionShiftMaterial>;

  constructor(
    @Inject(CONNECTION)
    private readonly connection: DataSource,
  ) {
    this.productRepo = this.connection.getRepository(Product);
    this.rawMaterialRepo = this.connection.getRepository(RawMaterial);
    this.recipeRepo = this.connection.getRepository(Recipe);
    this.configRepo = this.connection.getRepository(ProductionConfig);
    this.shiftRepo = this.connection.getRepository(ProductionShift);
    this.shiftMaterialRepo = this.connection.getRepository(ProductionShiftMaterial);
  }

  // ─── Products ─────────────────────────────────────────────────────────────

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create(dto);
    return this.productRepo.save(product);
  }

  async findAllProducts(): Promise<Product[]> {
    return this.productRepo.find({ order: { name: 'ASC' } });
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['recipes', 'recipes.rawMaterial', 'config'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findProductById(id);
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.findProductById(id);
    await this.productRepo.remove(product);
  }

  // ─── Raw Materials ─────────────────────────────────────────────────────────

  async createRawMaterial(dto: CreateRawMaterialDto): Promise<RawMaterial> {
    const material = this.rawMaterialRepo.create({
      name: dto.name,
      unit: dto.unit,
      currentStock: dto.current_stock ?? 0,
      reorderLevel: dto.reorder_level ?? 0,
    });
    return this.rawMaterialRepo.save(material);
  }

  async findAllRawMaterials(): Promise<RawMaterial[]> {
    return this.rawMaterialRepo.find({ order: { name: 'ASC' } });
  }

  async findRawMaterialById(id: string): Promise<RawMaterial> {
    const material = await this.rawMaterialRepo.findOne({ where: { id } });
    if (!material) throw new NotFoundException('Raw material not found');
    return material;
  }

  async updateRawMaterial(
    id: string,
    dto: UpdateRawMaterialDto,
  ): Promise<RawMaterial> {
    const material = await this.findRawMaterialById(id);
    if (dto.name !== undefined) material.name = dto.name;
    if (dto.unit !== undefined) material.unit = dto.unit;
    if (dto.current_stock !== undefined) material.currentStock = dto.current_stock;
    if (dto.reorder_level !== undefined) material.reorderLevel = dto.reorder_level;
    return this.rawMaterialRepo.save(material);
  }

  async deleteRawMaterial(id: string): Promise<void> {
    const material = await this.findRawMaterialById(id);
    await this.rawMaterialRepo.remove(material);
  }

  // ─── Recipe ────────────────────────────────────────────────────────────────

  async upsertRecipe(productId: string, dto: CreateRecipeDto | UpdateRecipeDto): Promise<Recipe[]> {
    const product = await this.findProductById(productId);

    // Replace all existing recipe lines for this product
    await this.recipeRepo.delete({ product: { id: productId } });

    const lines = await Promise.all(
      dto.lines.map(async (line) => {
        const rawMaterial = await this.rawMaterialRepo.findOne({
          where: { id: line.raw_material_id },
        });
        if (!rawMaterial) {
          throw new NotFoundException(
            `Raw material ${line.raw_material_id} not found`,
          );
        }
        return this.recipeRepo.create({
          product,
          rawMaterial,
          quantityRequired: line.quantity_required,
          unit: line.unit,
        });
      }),
    );

    return this.recipeRepo.save(lines);
  }

  async findRecipeByProduct(productId: string): Promise<Recipe[]> {
    await this.findProductById(productId);
    return this.recipeRepo.find({
      where: { product: { id: productId } },
      relations: ['rawMaterial'],
      order: { created_at: 'ASC' },
    });
  }

  // ─── Production Config ─────────────────────────────────────────────────────

  async upsertConfig(
    productId: string,
    dto: CreateProductionConfigDto | UpdateProductionConfigDto,
  ): Promise<ProductionConfig> {
    const product = await this.findProductById(productId);

    let config = await this.configRepo.findOne({
      where: { product: { id: productId } },
    });

    const mapped = {
      expectedOutputQuantity: (dto as CreateProductionConfigDto).expected_output_quantity ?? (dto as UpdateProductionConfigDto).expected_output_quantity,
      expectedOutputUnit: (dto as CreateProductionConfigDto).expected_output_unit ?? (dto as UpdateProductionConfigDto).expected_output_unit,
      productionTimeMinutes: (dto as CreateProductionConfigDto).production_time_minutes ?? (dto as UpdateProductionConfigDto).production_time_minutes,
      expectedDowntimeMinutes: dto.expected_downtime_minutes,
    };

    if (config) {
      if (mapped.expectedOutputQuantity !== undefined) config.expectedOutputQuantity = mapped.expectedOutputQuantity;
      if (mapped.expectedOutputUnit !== undefined) config.expectedOutputUnit = mapped.expectedOutputUnit;
      if (mapped.productionTimeMinutes !== undefined) config.productionTimeMinutes = mapped.productionTimeMinutes;
      if (mapped.expectedDowntimeMinutes !== undefined) config.expectedDowntimeMinutes = mapped.expectedDowntimeMinutes;
    } else {
      config = this.configRepo.create({ ...mapped, product });
    }

    return this.configRepo.save(config);
  }

  async findConfigByProduct(productId: string): Promise<ProductionConfig> {
    await this.findProductById(productId);
    const config = await this.configRepo.findOne({
      where: { product: { id: productId } },
      relations: ['product'],
    });
    if (!config) throw new NotFoundException('Production config not found');
    return config;
  }

  // ─── Production Shifts ─────────────────────────────────────────────────────

  async createShift(
    userId: string,
    dto: CreateProductionShiftDto,
  ): Promise<ProductionShift> {
    const product = await this.findProductById(dto.product_id);
    const userRepo = this.connection.getRepository(User);
    const createdBy = await userRepo.findOne({ where: { id: userId } });

    if (!createdBy) throw new NotFoundException('User not found');

    const shift = this.shiftRepo.create({
      product,
      startedAt: new Date(dto.started_at),
      notes: dto.notes ?? null,
      status: ShiftStatus.IN_PROGRESS,
      createdBy,
    });

    const savedShift = await this.shiftRepo.save(shift);

    if (dto.materials?.length) {
      await this.saveShiftMaterials(savedShift, dto.materials);
    }

    return this.findShiftById(savedShift.id);
  }

  async findAllShifts(): Promise<ProductionShift[]> {
    return this.shiftRepo.find({
      relations: ['product', 'createdBy', 'materials', 'materials.rawMaterial'],
      order: { startedAt: 'DESC' },
    });
  }

  async findShiftById(id: string): Promise<ProductionShift> {
    const shift = await this.shiftRepo.findOne({
      where: { id },
      relations: ['product', 'createdBy', 'materials', 'materials.rawMaterial'],
    });
    if (!shift) throw new NotFoundException('Production shift not found');
    return shift;
  }

  async completeShift(id: string, dto: CompleteShiftDto): Promise<ProductionShift> {
    const shift = await this.findShiftById(id);

    if (shift.status !== ShiftStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress shifts can be completed');
    }

    shift.status = ShiftStatus.COMPLETED;
    shift.completedAt = new Date();
    shift.actualOutputQuantity = dto.actual_output_quantity;
    if (dto.notes) shift.notes = dto.notes;

    const saved = await this.shiftRepo.save(shift);

    if (dto.materials?.length) {
      await this.shiftMaterialRepo.delete({ shift: { id } });
      await this.saveShiftMaterials(saved, dto.materials);
    }

    return this.findShiftById(saved.id);
  }

  async abortShift(id: string, dto: AbortShiftDto): Promise<ProductionShift> {
    const shift = await this.findShiftById(id);

    if (shift.status !== ShiftStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress shifts can be aborted');
    }

    shift.status = ShiftStatus.ABORTED;
    shift.completedAt = new Date();
    if (dto.notes) shift.notes = dto.notes;

    return this.shiftRepo.save(shift);
  }

  // ─── Reports ───────────────────────────────────────────────────────────────

  async getReportSummary() {
    const [total, completed, aborted] = await Promise.all([
      this.shiftRepo.count(),
      this.shiftRepo.count({ where: { status: ShiftStatus.COMPLETED } }),
      this.shiftRepo.count({ where: { status: ShiftStatus.ABORTED } }),
    ]);

    const completedShifts = await this.shiftRepo.find({
      where: { status: ShiftStatus.COMPLETED },
      relations: ['product'],
    });

    const byProduct = new Map<
      string,
      { productId: string; productName: string; totalOutput: number; shiftCount: number }
    >();

    for (const shift of completedShifts) {
      if (!shift.product) continue;
      const existing = byProduct.get(shift.product.id);
      if (existing) {
        existing.totalOutput += Number(shift.actualOutputQuantity ?? 0);
        existing.shiftCount += 1;
      } else {
        byProduct.set(shift.product.id, {
          productId: shift.product.id,
          productName: shift.product.name,
          totalOutput: Number(shift.actualOutputQuantity ?? 0),
          shiftCount: 1,
        });
      }
    }

    return {
      totalShifts: total,
      completedShifts: completed,
      abortedShifts: aborted,
      inProgressShifts: total - completed - aborted,
      byProduct: Array.from(byProduct.values()).sort(
        (a, b) => b.totalOutput - a.totalOutput,
      ),
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async saveShiftMaterials(
    shift: ProductionShift,
    materials: { raw_material_id: string; quantity_used: number }[],
  ): Promise<void> {
    const lines = await Promise.all(
      materials.map(async (m) => {
        const rawMaterial = await this.rawMaterialRepo.findOne({
          where: { id: m.raw_material_id },
        });
        if (!rawMaterial) {
          throw new NotFoundException(`Raw material ${m.raw_material_id} not found`);
        }
        return this.shiftMaterialRepo.create({
          shift,
          rawMaterial,
          quantityUsed: m.quantity_used,
        });
      }),
    );
    await this.shiftMaterialRepo.save(lines);
  }
}
