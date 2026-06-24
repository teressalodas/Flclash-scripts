# Flclash-scripts

脚本专为 **Flclash**制作，或可用于**Clash Verge Rev**，但后者未测试，不保证可用性与稳定性。

---

* **scripts1**：分流细致、分组丰富、功能全面。
  详细介绍：https://linux.do/t/topic/995297

* **scripts2**：仅保留分组，移除 scripts1 中大部分分流规则，仅保留广告屏蔽。策略组大幅精简。
针对订阅源节点不固定场景优化，支持**动态生成节点组**。
  详细介绍：https://linux.do/t/topic/1010793

* **scripts3**：在 scripts2 基础上进一步简化，**引入节点名称过滤**。
  详细介绍：https://linux.do/t/topic/1063863

* **scripts4**：与 scripts3 功能相同，**仅图标 CDN 不同**：

    * scripts3 使用 `testingcf.jsdelivr.net`
    * scripts4 使用 `cdn.jsdelivr.net`（大多数场景下图片加载更流畅）

* **scripts5**：虽然之前的脚本已在正则表达式中使用 `i` 标志，但在部分情况下仍存在大小写匹配异常。
  详细介绍：https://linux.do/t/topic/1092160

* **scripts6**：近期出现 **icon 资源加载异常** 问题。
在 scripts5 的基础上进行了调整：

    * 将 icon 与 rule 从**硬编码 URL**改为**变量拼接**，方便根据网络情况灵活修改上游源。
    * 当前源：

  ```
   const ICON_BASE = "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/";
   const RULE_BASE = "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/";
   ```

* **scripts7**：在 scripts6 的基础上进行优化（详细介绍：https://linux.do/t/topic/1251899 ）：
   * 新增“倍率过滤”，当前设置为过滤3倍以上的节点
   * 全量遍历优化为基于 `.some()` 方法的短路检测，避免不必要的计算
   * 调整正则匹配策略，关键词过滤移除了 `i` 标记，改为严格匹配大小写
   * 优化了代码结构与可读性：
     1. 代码严格按照 `常量定义 -> 数据清洗 (Filter) -> 地区探测 (Detect) -> 组装 (Build)` 的顺序排列，符合人类阅读习惯
     2. 将地区定义改为标准的 `REGIONS` 数组对象，直接遍历，去除了所有不必要的中间转换
     3. 移除了 `URL_TEST_DEFAULT` 等利用率低的中间变量

* **scripts8**：在 scripts7 的基础上新增了三个规则提供者：`ChinaIp`  `ChinaMedia` `GoogleCNProxyIP`。优化了一下节点倍率识别。

* **scripts9**：在 scripts8 的基础上移除了对“手动选择”策略组的过滤，防止脚本运行之后误杀导致部分节点不出现。详细介绍：https://linux.do/t/topic/1383821

* **scripts10**：jsDelivr 近期加强了对代理相关规则仓库的限制，导致直接通过 cdn.jsdelivr.net 访问这些链接时会提示“User blocked”。所以切换至稳定的 GitHub Raw 链接。同时引入了 AI 专项和精细的大厂服务分流，因为现在不仅使用了 ACL4SSR 维护的规则列表，所以取消了变量拼接。规则提供者从10个扩展至约23个，融合 Loyalsoldier 与 ACL4SSR 规则集，新增了对 AI、Telegram、Netflix 等海外服务的专用代理支持，以及更彻底的广告与隐私追踪阻断（如EasyPrivacy、BanEasyListChina），分流逻辑更精细全面。

* **scripts11**：移除了大量的尤其是去广告方面的规则，回归简洁，仅保留必要功能和规则。scripts10的规则过多，性能差。去广告方面的效果提升微乎其微，尤其是app内的广告，但是安卓7以上的手机不root无法mitm。

* **scripts12**：在scripts11基础上， 新增 `normalizeName()` 函数，先对节点名称做“归一化”，自动识别并转换国旗 emoji，去除空格、括号等干扰字符，提升匹配准确率。地区识别新增了三字码和机场码，覆盖更多机场命名规范。详细介绍：https://linux.do/t/topic/1430052

* **scripts13**：在scripts12基础上修改，将原来的分流规则覆盖改为了合并，最高优先级屏蔽广告/内网直连 ➡️ 机场自带规则 ➡️ GFW/CN 泛解析兜底。自动拦截并修复失效的策略组指向（重定向至“节点选择”），告别了 `proxy not found` 导致的配置加载失败。使用现代 JS 语法全面重构了底层逻辑，减少了冗余循环，脚本运行更快、代码更清爽。仅不到80行。

* **scripts14**：基于 scripts13 修改。经确认，FLClash 的覆写脚本与附加规则无法同时生效，因此添加了 `myManualRules`，可根据个人需要在其中添加规则。详细介绍：https://linux.do/t/topic/1941918

   - 过滤掉原始配置中引用了本脚本未定义的 `rule-provider` 的 `RULE-SET` 规则，避免 `rule set [xxx] not found` 报错。
   - 修复原始规则中带有中文策略组名（如 `🎯 全球直连`、`🛑 广告拦截`）被一律替换为 `节点选择` 的问题，改为按关键字智能映射：含"直连"→`DIRECT`，含"拦截/广告"→`REJECT`，其余→`节点选择`。
   - 为 IP 类规则自动追加 `no-resolve`，避免触发不必要的 DNS 解析。
   - `rule-providers` 用 `rp()` 工厂函数生成，消除重复结构。
   - `REGIONS` 从对象数组改为元组数组，减少冗余字段名。
   - emoji 国旗替换改为 `flagMap` + `replaceAll`，抽成独立的 `norm()` 函数。
   - target 映射逻辑抽成 `mapTarget()` 单行函数。

---

**持续优化中，欢迎反馈使用体验！**
