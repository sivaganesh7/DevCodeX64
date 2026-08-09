import { Test, TestingModule } from "@nestjs/testing"
import { HealthService } from "./health.service"
import { PrismaService } from "../../database/prisma.service"

describe("HealthService", () => {
  let service: HealthService

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile()

    service = module.get<HealthService>(HealthService)
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })

  it("should return status ok when database is connected", async () => {
    mockPrismaService.$queryRaw.mockResolvedValueOnce([{ "?column?": 1 }])

    const result = await service.check()

    expect(result.status).toBe("ok")
    expect(result.database).toBe("connected")
    expect(result.timestamp).toBeDefined()
    expect(result.version).toBeDefined()
  })

  it("should return status degraded when database is disconnected", async () => {
    mockPrismaService.$queryRaw.mockRejectedValueOnce(new Error("Connection refused"))

    const result = await service.check()

    expect(result.status).toBe("degraded")
    expect(result.database).toBe("disconnected")
  })
})
