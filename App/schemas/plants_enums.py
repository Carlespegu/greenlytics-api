from enum import Enum


class PlantTypeEnum(str, Enum):
    plant = "plant"
    crop = "crop"
    tree = "tree"
    shrub = "shrub"


class PlantingTypeEnum(str, Enum):
    single = "single"
    group = "group"
    plot = "plot"


class LocationTypeEnum(str, Enum):
    indoor = "indoor"
    outdoor = "outdoor"
    greenhouse = "greenhouse"


class SunExposureEnum(str, Enum):
    full_sun = "full_sun"
    partial_shade = "partial_shade"
    shade = "shade"


class PlantStatusEnum(str, Enum):
    healthy = "healthy"
    warning = "warning"
    critical = "critical"
    inactive = "inactive"
