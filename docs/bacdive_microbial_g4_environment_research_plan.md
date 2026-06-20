# BacDive Microbial G4 Environment Research Plan

## 范围

本方案只保留适合做 Microbial G4 environment research 的 BacDive 环境类型。目标是为后续彻底重构数据表提供方法约束。以及方便API限定各种条件来查询结果,返回前端Vega图所需要的数据和格式.所有统计为分布图,连续数据用散点图,分类数据用箱型图,要求基本单位是一个strain(即该strain对应的assembly的g4 type的quadruplex sequence的数据).

所有的Microbial species以数据库存在的为基础,即/Volumes/G4Vista/bacdive_final_assembly_list.csv中的bacdive_id和其对应的resolved_accession.注意下面的原始值审计的数量只是bacdive_common_strains.json的统计数据.

明确舍弃的数据：

- 所有 `optimum` 数据，包括 optimum temperature、optimum pH，以及 `halophily.tested relation == optimum`。
- `metabolite utilization`、`enzyme activity`、`API tests`。
- `antibiotic susceptibility`、`fatty acid profile`。
- i-motif、G4/i-motif ratio、G4/i-motif asymmetry、non-gene G4 density 字段。

所有无法字段标准化的研究类别的assemblybly,视为无该类别数据,不参与统计等一系列流程.

分析单位固定为 `assembly_accession`。BacDive metadata 先按 `bacdive_id` 选择 strain，再通过 BacDive assembly bridge 映射到 G4Vista 的 resolved assembly。单条 BacDive 表型记录和单条 quadruplex sequence 都不能作为独立统计样本。

后续分析报告可以保留原始 `p_value`、效应量、置信区间和样本数，数据库核心字段也只围绕这些直接结果设计。

## 保留类型总表

| 研究类别 | 类型 | BacDive metadata 来源 | metadata strains | assembly-linked strains | 原始值形态 | 推荐用途 |
|---|---|---|---:|---:|---|---|
| Primary environment traits | Growth temperature | `Culture and growth conditions.culture temp` 中 `type == growth` 且 `growth == positive` | 17,039 | 10,829 | 数值字符串，单值或范围 | 直接关联 genome-level quadruplex sequence density |
| Primary environment traits | Growth pH | `Culture and growth conditions.culture pH` 中 `type == growth` 且 `ability == positive` | 6,122 | 3,868 | 数值字符串，主要是范围 | 直接关联 genome-level quadruplex sequence density |
| Primary environment traits | Oxygen tolerance | `Physiology and metabolism.oxygen tolerance` | 11,193 | 7,496 | 少量字符串类别，有同义显示 | 按氧耐受类别做分组比较和回归 |
| Primary environment traits | Halophily / salt | `Physiology and metabolism.halophily`，排除 `tested relation == optimum` | 7,855 | 5,110 | 盐名、growth 结果、relation、浓度和单位混合 | 有可靠盐浓度时做连续变量关联；否则做有序分组比较 |
| Ecological context traits | Sample type / isolated from | `Isolation, sampling and environmental information.isolation.sample type` | 16,951 | 10,735 | 高基数字符串，强同义显示差异 | 分层、协变量、富集分析、敏感性分析 |
| Ecological context traits | Host species | `Isolation, sampling and environmental information.isolation.host species` | 3,448 | 2,329 | 生物名字符串，有少量拼写和格式差异 | host-associated subgroup 和富集分析 |

计数来源：

```text
/Volumes/G4Vista/data/bacdive/metadata/bacdive_common_strains.json
/Volumes/G4Vista/data/log/bacdive_final_assembly_list.csv
```

## 共享数据原则

### 主键和连接链路

推荐连接链路：

```text
bacdive_common_strains.json: bacdive_id
  -> bacdive_final_assembly_list.csv: bacdive_id, resolved_accession
  -> G4Vista core tables: assembly_accession
```

使用 `resolved_accession` 作为 G4Vista canonical `assembly_accession`。保留 `input_accession` 作为来源记录和排错信息。

### Assembly-level 聚合

每个 trait 都按以下顺序处理：

1. 从 BacDive metadata 抽取匹配记录。
2. 写入 raw observation，保留 BacDive 原始值和原始 record JSON。
3. 将 raw observation 标准化成 numeric range、categorical value、geography value 或 multi-label value。
4. 按 `bacdive_id` 映射到 resolved assemblies。
5. 聚合到 one row per `assembly_accession` per trait 的 analysis-ready table。
6. 保留 `record_count`、`observation_ids`、`raw_values`、`standardization_status` 和 `exclusion_reason`。

如果多个 `bacdive_id` 映射到同一个 `assembly_accession`，先保留所有来源 `bacdive_id`，再按 assembly-level 规则聚合。

### quadruplex outcome 字段

Primary outcomes：

```text
quadruplex_density_per_mb
gene_quadruplex_density_per_mb
upstream_quadruplex_density_per_mb
downstream_quadruplex_density_per_mb
intergenic_quadruplex_density_per_mb
```

Supporting fields：

```text
g4_count
g4_mean_score
genome_size
assembly_level
phylum
genus
```

Density 分母使用 genome size。`intergenic` 必须通过 GFF `ID` / `Parent` 层级递归定义，不能用 `feature != gene` 近似。

## 原始值审计和字段标准化

### 总览

| 类型 | 实际值形态 | 单位情况 | 主要标准化风险 | 推荐标准化输出 |
|---|---|---|---|---|
| Growth temperature | 38,075 条有效值；28,471 单值；9,604 范围；1,010 个 unique raw values | 原始字段没有单位列；按 BacDive culture temperature 语义统一视为 Celsius | 单值和范围混合；同一 assembly 可能有多条记录 | `numeric_min`、`numeric_max`、`numeric_midpoint`、`numeric_width`、`numeric_unit = celsius` |
| Growth pH | 6,257 条值；483 单值；5,774 范围；697 个 unique raw values | pH 无单位；`PH range` 是 acidophile / alkaliphile 标签，不是单位 | `06-09` 与 `6.0-9.0` 等显示不同但数值相同；范围占绝大多数 | `numeric_min`、`numeric_max`、`numeric_midpoint`、`numeric_width`、`ph_range_label` |
| Oxygen tolerance | 16,329 条值；9 个 raw labels | 不涉及单位 | `aerobe` vs `obligate aerobe`、`anaerobe` vs `obligate anaerobe` 等同义或层级差异 | `canonical_oxygen_class`、`oxygen_specificity`、`raw_oxygen_label` |
| Halophily / salt | 排除 optimum 后 13,811 条记录；13,753 条有 concentration；7,476 单值；6,277 范围 | `%`、`%(w/v)`、`M`、`g/L` 混合 | `%` 是否等同 w/v 不应静默假设；NaCl 占绝大多数但仍有其它盐 | `canonical_salt_name`、`relation`、`growth_result`、`numeric_min`、`numeric_max`、`numeric_unit` |
| Sample type / isolated from | 32,337 条值；20,504 个 unique raw values | 不涉及单位 | 大量同义显示差异，例如 soil / Soil / Environment, Soil / From soil | `habitat_category_id`、`canonical_habitat_label`、`mapping_confidence`、multi-label |
| Host species | 5,711 条值；1,337 个 unique raw values | 不涉及单位 | 生物名格式、大小写、括号和 `sp.` 差异；host taxonomy 与微生物 taxonomy 混杂 | `host_name_canonical`、`host_taxon_id`、`mapping_confidence` |

### Growth Temperature

原始值观察：

- 字段：`temperature`。
- 记录已经限定为 `type == growth` 且 `growth == positive`。
- raw values 例子：`28`、`30`、`37`、`10-37`、`15-37`、`30-37`、`25-41`。
- 原始记录没有独立 unit 字段；这里按 BacDive culture temperature 语义统一存为 `celsius`。
- 所有有效值都可解析为单值或 `min-max` 范围。

标准化规则：

- 单值 `37` 标准化为 `numeric_min = 37`、`numeric_max = 37`、`numeric_midpoint = 37`、`numeric_width = 0`。
- 范围 `10-37` 标准化为 `numeric_min = 10`、`numeric_max = 37`、`numeric_midpoint = 23.5`、`numeric_width = 27`。
- 多条 BacDive records 先在 `bacdive_id` 层合并为总体范围，再聚合到 `assembly_accession`。
- 无法解析的记录写入 raw observation，但 `standardization_status = failed`，不进入分析 ready 表。

研究方案：

- 主 predictor 使用 `growth_temperature_midpoint`。
- 同时保留 `growth_temperature_min`、`growth_temperature_max` 和 `growth_temperature_width`，用于检查结果是否由宽范围记录驱动,和切换研究的predictor。
- Outcome 使用 genome-level quadruplex sequence density。
- 解释只写 statistical association，不写 temperature causesquadruplex sequence changes。

### Growth pH

原始值观察：

- 字段：`pH`。
- 记录已经限定为 `type == growth` 且 `ability == positive`。
- raw values 例子：`06-09`、`6.0-9.0`、`6-9`、`5.5-8.5`、`7`。
- `PH range` 标签主要是 `alkaliphile` 和 `acidophile`.
- 大多数 pH 是范围，不是单点值。

标准化规则：

- `06-09`、`6-9`、`6.0-9.0` 都标准化为 `numeric_min = 6`、`numeric_max = 9`, `numeric_midpoint` = `numeric_min` + `numeric_max` / 2。
- 单值 `7` 标准化为 `numeric_min = numeric_max = numeric_midpoint = 7.0`。
- 只接受 `0 <= pH <= 14` 的解析结果。
- `PH range` 标签单独存为 categorical annotation，不参与 numeric parsing。
- 多条记录先在 `bacdive_id` 层合并为总体 pH range，再聚合到 assembly。

研究方案：

- 主 predictor 使用 `growth_pH_midpoint`。
- 保留 `growth_pH_width`，后续可以筛除过宽 pH range 做 sensitivity analysis。
- `PH range` 标签适合做分层或展示，不应替代 numeric pH,做箱型图比较两个`alkaliphile` 和 `acidophile`下 quadruplex sequence density的分布
- 解释只写 growth pH-associated quadruplex sequence density，不写因果。

### Oxygen Tolerance

原始值观察：

| raw value | records | 推荐 canonical class |
|---|---:|---|
| `aerobe` | 7,495 | `aerobe` |
| `obligate aerobe` | 1,969 | `aerobe`，并保留 `oxygen_specificity = obligate` |
| `anaerobe` | 3,318 | `anaerobe` |
| `obligate anaerobe` | 195 | `anaerobe`，并保留 `oxygen_specificity = obligate` |
| `facultative anaerobe` | 2,009 | `facultative` |
| `facultative aerobe` | 103 | `facultative` |
| `microaerophile` | 1,225 | `microaerophile` |
| `microaerotolerant` | 4 | `microaerophile` 或 `microaerotolerant`，需要保留 raw label |
| `aerotolerant` | 11 | `aerotolerant` |

同一 strain 有多条 oxygen records 的情况不少，扫描中 2,149 个 strains 有多个 raw oxygen labels。大多数是层级或同义差异，例如 `aerobe` + `obligate aerobe`，或者 `anaerobe` + `obligate anaerobe`。

标准化规则：

- 先保存 raw label，再映射到 canonical class。
- `obligate aerobe` 和 `aerobe` 不丢信息：canonical class 用 `aerobe`，specificity 用 `obligate`。
- `facultative anaerobe` 和 `facultative aerobe` 统一为 `facultative`，raw label 保留。
- 真正冲突的多值组合标记为 `mixed_conflict`，不直接并入 primary class comparison。

研究方案：

- 主分析使用 canonical oxygen class 做 箱型图,查看各类别下的strain的quadruplex sequence密度的分布。
- 同时做 `strict_anaerobe` vs `oxygen_exposed` 的二分类分析。
- 网页查询需要支持按  canonical class 筛选。
- 解释只写 oxygen tolerance class-associated differences。

### Halophily / Salt

原始值观察：

- 已排除 `tested relation == optimum`。
- 非 optimum 记录中，`tested relation` 包括 `growth` 13,065、`maximum` 644、`minimum` 31、`resistant` 10、`other` 4。
- `growth` 包括 `positive` 8,190、`no` 5,502、`inconsistent` 20。
- 盐名以 NaCl 为主：`NaCl` 13,694 条；另有 `Marine salts`、`MgCl2`、`Sea Salts (S9883)`、`KCl`、`Na+`、`Na2SO4` 等。
- 浓度单位混合：`%` 11,088、`%(w/v)` 2,523、`M` 85、`g/L` 53。
- 正向 growth 记录中有 1,938 个单值和 6,252 个范围。


标准化规则：

- `NaCl`、`NaCL` 标准化为 `nacl`；`Marine salts` 和 `Sea Salts (S9883)` 标准化为 `marine_salts`，但保留 raw salt name。
- `tested relation` 原样规范到枚举：`growth`、`maximum`、`minimum`、`resistant`、`other`。
- `growth` 规范到枚举：`positive`、`negative`、`inconsistent`、`unknown`。
- 范围数值 都标准化为 `numeric_min = min%`、`numeric_max = max%`, `numeric_midpoint` = `numeric_min` + `numeric_max` / 2。
- 单值  标准化为 `numeric_min = numeric_max = numeric_midpoint = 7`。

数据清洗:

- 非 optimum 记录中，`tested relation`只要`growth`.`growth`只包括`positive`
- 盐名只要NaCl.
- 只保留浓度单位：`%`的数据.

研究方案：
- 做散点图,看不同浓度下,g4 密度的分布情况.
- 主数据集优先使用 `tested relation == growth` 且 `growth == positive` 的浓度范围，表示可生长 salt range。
- 
- 如果 NaCl + percentunit 覆盖足够大，主分析用 `salt_concentration_midpoint`。但是提供各种类型结果的选择,以便网页请求自定义.


### Sample Type / Isolated From

原始值观察：

- 32,337 条 sample type values。
- 20,504 个 unique raw values，说明不能直接把 raw string 当作网页筛选维度。
- 明显同义显示差异：

| canonical concept | raw variants examples |
|---|---|
| `soil` | `soil`、`Soil`、`Environment, Soil`、`From soil`、`soil sample` |
| `seawater` | `seawater`、`Seawater`、`sea water`、`Environment, Sea water`、`From sea water` |
| `human_feces` | `Human feces`、`human faeces`、`Human, Feces`、`From human faeces` |
| `marine_sediment` | `marine sediment`、`Marine sediment`、`Environment, Marine sediment`、`From marine sediment` |
| `human_blood` | `Human, Blood`、`Human blood`、`human blood` |

标准化规则：

- raw string 必须完整保留。
- 先做轻量 text normalization：case-fold、去首尾空白、统一 `faeces` / `feces`、统一 `sea water` / `seawater`、移除前缀 `From` / `Environment`。
- 再映射到 controlled habitat categories。
- 一个 sample 可以 multi-label，例如 host-associated + human-associated + feces。
- 每个映射保留 `mapping_method` 和 `mapping_confidence`。

只统计以下 controlled categories：

```text
soil
water
marine
sediment
host_associated
human_associated
animal_associated
plant_associated
food
industrial
hot_spring
wastewater
air
```

研究方案：

- sample type的研究要分为三种:
  1. 宏观的,即controlled categories;
  2. host_associated的,包括
     human_associated,animal_associated,plant_associated,fungus_associated,other_eukaryote_associated,unknown_or_other_associated
  3. human_associated:  
- 其中host_associated,human_associated,animal_associated,plant_associated等要单独研究是接下来类型的内容,这里只进行整体的统计,只是显示这些个大分类下的strain的g4密度分布,设计表时这里的数据可以是Host Species的数据的整合.
- 作为 ecological context trait，用于分层, 查看不同categories下的g4密度的箱型图。
- 不建议直接写成 habitat 导致 G4 density 变化。
- 网页上应默认展示 canonical habitat category，并允许展开 raw sample type。并且通过checklist的形式选择同时想看的category的箱型图.


### Host Species

原始值观察：

- 5,711 条 host species values。
- 1,337 个 unique raw values。
- `Homo sapiens` 占 3,107 条，是明显主导类。
- 其它常见 raw values 包括 `Oryza sativa`、`Zea mays`、`Sphagnum`、`Salmo salar`、`Glycine max`、`Apis mellifera` 等。
- 观察到少量格式差异，例如 `Morinda citrifolia` vs `Morinda Citrifolia`、`Pachastrella sp.` vs `Pachastrella sp`、带多余括号的 scientific name。

标准化规则：

- raw host species 完整保留。
- 基础 normalization：trim、case normalization、清理多余括号、统一 `sp.` 格式。
- 能匹配 NCBI Taxonomy 时保存 `host_taxon_id`。
- 同时映射 broad host group：

```text
human
mammal_nonhuman
bird
fish
insect
plant
fungus
other_eukaryote
unknown_or_other
```

研究方案：

- 作为 ecological context trait。
- 主分析是 不同 host group。
- 必须加入微生物 taxonomy controls，因为 host association 与 bacterial taxonomy 高度混杂。
- 不写 host causes G4 changes。

## 数据库结构设计

设计目标：

- 插入时不需要网页后端再次解析 BacDive JSON。
- 保留 raw provenance，方便追踪标准化错误。
- 支持按 trait、category、numeric range、taxonomy、assembly 和 analysis run 快速查询。而且要支持多个trait、category的混合查询,即交集.但是分类数据类型与连续数据类型,结果变为不同分组的结果的连续数据.
- 支持 future traits 扩展，不把每个 trait 都硬编码成一张完全不同的表。

### 1. Trait catalog

`bacdive_environment_trait`

| 字段 | 类型建议 | 用途 |
|---|---|---|
| `trait_code` | String | 例如 `growth_temperature`、`growth_pH`、`oxygen_tolerance` |
| `trait_group` | LowCardinality(String) | `primary_environment` 或 `ecological_context` |
| `display_name` | String | 网页显示名 |
| `value_kind` | LowCardinality(String) | `numeric_range`、`categorical`、`geography`、`multi_label` |
| `source_path` | String | BacDive metadata path |
| `retention_rule` | String | 例如 exclude optimum |
| `is_queryable` | UInt8 | 是否进入网页筛选 |

### 2. Raw observations

`bacdive_environment_raw_observation`

| 字段 | 类型建议 | 用途 |
|---|---|---|
| `observation_id` | String | 稳定 hash：`bacdive_id + trait_code + source_path + record_index` |
| `bacdive_id` | UInt64 | BacDive strain key |
| `trait_code` | LowCardinality(String) | trait key |
| `source_path` | String | 原始 metadata path |
| `source_ref` | Nullable(String) | BacDive `@ref` |
| `raw_value` | String | 原始核心值 |
| `raw_record_json` | String | 原始 record JSON |
| `inclusion_status` | LowCardinality(String) | `included`、`excluded`、`failed_standardization` |
| `exclusion_reason` | Nullable(String) | 例如 `optimum_record`、`unparseable_numeric_value` |

### 3. Standardized observations

Numeric traits 使用一张统一表：

`bacdive_environment_numeric_observation`

| 字段 | 类型建议 | 用途 |
|---|---|---|
| `observation_id` | String | 连接 raw observation |
| `trait_code` | LowCardinality(String) | numeric trait |
| `numeric_min` | Float64 | 解析后的下界 |
| `numeric_max` | Float64 | 解析后的上界 |
| `numeric_midpoint` | Float64 | midpoint |
| `numeric_width` | Float64 | range width |
| `numeric_unit_raw` | String | 原始单位，例如 `%`、`%(w/v)` |
| `numeric_unit_canonical` | LowCardinality(String) | `celsius`、`pH`、`percent`、`percent_wv`、`molar`、`g_per_l` |
| `is_range` | UInt8 | 是否来自范围 |
| `unit_conversion_status` | LowCardinality(String) | `not_needed`、`safe`、`unsafe`、`not_attempted` |

Categorical 和 multi-label traits 使用字典加映射：

`bacdive_environment_category`

| 字段 | 类型建议 | 用途 |
|---|---|---|
| `category_id` | String | 稳定 category key |
| `trait_code` | LowCardinality(String) | trait key |
| `canonical_value` | String | 标准值 |
| `display_label` | String | 网页显示 |
| `parent_category_id` | Nullable(String) | 层级分类，例如 host_associated 下的 human_associated |
| `sort_order` | UInt16 | UI 排序 |

`bacdive_environment_category_observation`

| 字段 | 类型建议 | 用途 |
|---|---|---|
| `observation_id` | String | 连接 raw observation |
| `trait_code` | LowCardinality(String) | trait key |
| `category_id` | String | 标准 category |
| `raw_label` | String | 原始显示值 |
| `mapping_status` | LowCardinality(String) | `exact`、`normalized`、`manual`、`unmapped`、`conflict` |
| `mapping_confidence` | Float32 | 0-1 |

Geography 单独建表，避免把 country、continent 和 location 混在一个字符串字段：

`bacdive_environment_geography_observation`

| 字段 | 类型建议 | 用途 |
|---|---|---|
| `observation_id` | String | 连接 raw observation |
| `raw_country_name` | Nullable(String) | BacDive raw country |
| `iso_alpha3` | Nullable(String) | ISO alpha-3 |
| `canonical_country_name` | Nullable(String) | 标准 country name |
| `continent` | Nullable(String) | 标准 continent |
| `raw_geographic_location` | Nullable(String) | free text location |
| `mapping_status` | LowCardinality(String) | `exact`、`normalized`、`ambiguous`、`unmapped` |

### 4. Assembly-level query facts

`bacdive_environment_assembly_trait`

这是网页和分析最常用的事实表，一行表示一个 assembly 在一个 trait 下的标准化结果。

| 字段 | 类型建议 | 用途 |
|---|---|---|
| `assembly_accession` | String | canonical resolved accession |
| `trait_code` | LowCardinality(String) | trait key |
| `bacdive_ids` | Array(UInt64) | 来源 BacDive IDs |
| `observation_ids` | Array(String) | 来源 observations |
| `value_kind` | LowCardinality(String) | numeric / categorical / geography / multi_label |
| `numeric_min` | Nullable(Float64) | assembly-level numeric lower bound |
| `numeric_max` | Nullable(Float64) | assembly-level numeric upper bound |
| `numeric_midpoint` | Nullable(Float64) | assembly-level numeric midpoint |
| `numeric_width` | Nullable(Float64) | assembly-level range width |
| `numeric_unit_canonical` | Nullable(String) | numeric unit |
| `category_ids` | Array(String) | canonical categories |
| `canonical_values` | Array(String) | denormalized labels for fast UI |
| `standardization_status` | LowCardinality(String) | `ready`、`partial`、`conflict`、`failed` |
| `record_count` | UInt32 | source record count |
| `raw_values` | Array(String) | compact provenance |

推荐 ClickHouse 排序键：

```text
ORDER BY (trait_code, assembly_accession)
```

常用筛选字段可以加 projection 或物化查询表：

```text
trait_code
numeric_midpoint
numeric_min
numeric_max
category_ids
canonical_values
```

### 5. Assembly trait + G4 density read model

`bacdive_environment_g4_analysis_dataset`

这是离线分析和网页散点图最直接读取的 denormalized table。

| 字段 | 类型建议 | 用途 |
|---|---|---|
| `assembly_accession` | String | assembly key |
| `trait_code` | LowCardinality(String) | trait key |
| `trait_group` | LowCardinality(String) | primary / ecological |
| `numeric_midpoint` | Nullable(Float64) | numeric predictor |
| `numeric_min` | Nullable(Float64) | numeric lower bound |
| `numeric_max` | Nullable(Float64) | numeric upper bound |
| `numeric_unit_canonical` | Nullable(String) | unit |
| `category_ids` | Array(String) | category predictors |
| `canonical_values` | Array(String) | UI labels |
| `g4_density_per_mb` | Nullable(Float64) | outcome |
| `gene_quadruplex_density_per_mb` | Nullable(Float64) | outcome |
| `upstream_quadruplex_density_per_mb` | Nullable(Float64) | outcome |
| `downstream_quadruplex_density_per_mb` | Nullable(Float64) | outcome |
| `intergenic_quadruplex_density_per_mb` | Nullable(Float64) | outcome |
| `g4_count` | UInt64 | supporting |
| `g4_mean_score` | Nullable(Float64) | supporting |
| `genome_size` | Nullable(UInt64) | covariate |
| `gc_percent` | Nullable(Float64) | covariate |
| `domain` | LowCardinality(String) | taxonomy |
| `phylum` | LowCardinality(String) | taxonomy |
| `genus` | LowCardinality(String) | taxonomy |
| `species` | String | taxonomy |
| `assembly_level` | LowCardinality(String) | assembly quality |

推荐 ClickHouse 排序键：

```text
ORDER BY (trait_code, phylum, assembly_accession)
```

这个表可以直接支持：

- trait + numeric range 查询。
- trait + category 查询。
- taxonomy subgroup 查询。
- scatter/table preview。
- CSV download。

### 6. Analysis run 和结果表

`bacdive_environment_analysis_run`

| 字段 | 类型建议 | 用途 |
|---|---|---|
| `run_id` | String | 分析运行 ID |
| `trait_code` | LowCardinality(String) | trait key |
| `analysis_kind` | LowCardinality(String) | `numeric_regression`、`category_comparison`、`enrichment`、`stratified_summary` |
| `model_name` | String | 模型名 |
| `parameter_json` | String | 模型参数和筛选条件 |
| `source_dataset_version` | String | 输入数据版本 |
| `created_at` | DateTime | 运行时间 |
| `status` | LowCardinality(String) | `ok`、`insufficient_data`、`failed` |

`bacdive_environment_analysis_result`

| 字段 | 类型建议 | 用途 |
|---|---|---|
| `run_id` | String | analysis run |
| `result_id` | String | result key |
| `trait_code` | LowCardinality(String) | trait key |
| `outcome_metric` | LowCardinality(String) | G4 outcome |
| `predictor` | String | predictor name |
| `group_value` | Nullable(String) | category or group |
| `n_assemblies` | UInt32 | sample size |
| `estimate` | Nullable(Float64) | slope / mean difference / enrichment score |
| `effect_size` | Nullable(Float64) | standardized effect |
| `p_value` | Nullable(Float64) | raw p-value only |
| `ci_low` | Nullable(Float64) | confidence interval lower |
| `ci_high` | Nullable(Float64) | confidence interval upper |
| `status` | LowCardinality(String) | result status |
| `result_json` | String | extra model-specific payload |

`bacdive_environment_analysis_series`

用于存储网页图表需要的预计算点、bin、回归线或 category summaries。

| 字段 | 类型建议 | 用途 |
|---|---|---|
| `run_id` | String | analysis run |
| `series_id` | String | chart series key |
| `series_kind` | LowCardinality(String) | `scatter_sample`、`regression_line`、`numeric_bin`、`category_summary` |
| `x_value` | Nullable(Float64) | numeric x |
| `x_label` | Nullable(String) | categorical x |
| `y_value` | Nullable(Float64) | y |
| `y_metric` | LowCardinality(String) | G4 metric |
| `n_assemblies` | UInt32 | bin/category size |
| `payload_json` | String | extra chart data |

## 每个类型的插入输出设计

| 类型 | raw observation | standardized observation | assembly trait fact | analysis dataset |
|---|---|---|---|---|
| Growth temperature | 每条 positive growth temp record | numeric range, unit `celsius` | 每 assembly 一个 merged growth temperature range | numeric regression dataset |
| Growth pH | 每条 positive growth pH record | numeric range, unit `pH`，外加 `PH range` category | 每 assembly 一个 merged growth pH range | numeric regression dataset |
| Oxygen tolerance | 每条 oxygen tolerance record | category observation，保留 specificity | 每 assembly 一个 canonical oxygen class 或 conflict state | category comparison dataset |
| Halophily / salt | 每条 non-optimum halophily record | numeric range + salt category + relation + growth result | 每 assembly 一个 salt tolerance summary，必要时按 salt_name 拆分 | numeric or ordered-category dataset |
| Sample type / isolated from | 每条 sample type raw string | multi-label habitat categories | 每 assembly 多个 habitat category IDs | stratified / enrichment dataset |
| Geography | 每条 isolation geography record | geography observation | 每 assembly country/continent/location provenance | stratified / sampling-bias dataset |
| Host species | 每条 host species raw string | host taxonomy/category observation | 每 assembly host group IDs | host-associated enrichment dataset |

## 推荐执行顺序

1. 建立 `bacdive_environment_trait` catalog，先锁定 7 个保留 trait。
2. 从 BacDive JSON 生成 `bacdive_environment_raw_observation`，排除规则只写 inclusion/exclusion status，不丢 raw provenance。
3. 对 numeric、category、geography 分别生成 standardized observation tables。
4. 构建 `bacdive_strain_assembly`，用 `resolved_accession` 作为 canonical `assembly_accession`。
5. 生成 `bacdive_environment_assembly_trait`，保证 one row per `assembly_accession` per trait。
6. Join G4 density 和 taxonomy，生成 `bacdive_environment_g4_analysis_dataset`。
7. 离线分析写入 `bacdive_environment_analysis_run`、`bacdive_environment_analysis_result` 和 `bacdive_environment_analysis_series`。
8. 网页 API 只读 query facts 和 analysis result，不在请求时重新解析 BacDive raw JSON。
