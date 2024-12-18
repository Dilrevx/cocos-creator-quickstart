​
# 新手上路 - 工具链介绍
cocos creator：是一个界面类似 UE, Unity 的 2d/3d 工程编辑器。按我目前的理解，他们的操作逻辑也相似，不过 CC 的逻辑写起来可能更简单，因为用的是脚本语言 TypeScript 在浏览器环境运行，不需要编译

## 文件夹目录结构

​![download](https://github.com/user-attachments/assets/cfb80986-6caa-41c9-9dd2-9b7c02d0f318)

重要的是 assets, local, profiles, settings, package.json，需要添加到版本控制。其中，asset 是资产和元数据，其余的是配置。lib 是自动生成的。

## 编辑器窗口介绍

​​![download](https://github.com/user-attachments/assets/92ce3faf-de4c-4c37-a131-e784769c0747)

如图，UI 幻视 ps、unreal、vscode。应该说前端的逻辑会趋同嘛……

文档讲的很清楚，我觉得很关键的组件是用树来组织对象的层级管理器，感觉是带命名空间的图层这种感觉。

引入 TS 的基本逻辑是先写个脚本，填写生命周期函数，然后选中场景中的物体，在属性面板关联该脚本。

通常，一个游戏是靠不同的脚本逻辑驱动进行的。在 CC 中，每个 TS 脚本定义了一个组件 Component。将组件挂在到某个节点上（拖动 or 在属性检查器上 AddComponent）就可以生效。

# 快速开始：做一个 2d 游戏
和 Unity 类似，Cocos Creator 也是 ECS（Entity-Component-System） 架构，可以通过给 Node 添加不同的组件来实现游戏的功能。

本节和下一节分别实现 2d 和 3d 版本的同一个跳格子小游戏，点左键跳一格右键两格。

大体的流程和上面是一样的。

1. 搭建模型组成初始的场景地图

2. 编写脚本，给每个节点（模型）挂载脚本，实现移动跳跃逻辑，实现初始化和判定逻辑

3. 绘制 UI，控制相机

4. 在高一级的 Manager 管理所有 Component

## 搭建场景 - 场景编辑器
略。本游戏简化为了一个红方块站在一排白方块头顶上跳来跳去。

## 实现脚本逻辑 - Component & Node
这个 demo 里，红方块按 ↗↘ 的方式跳跃。作为演示，我们用 ts 实现水平方向的向右平动，然后用动画实现竖直方向的先上后下移动。（从这里也能看出来，更复杂的移动代码可能做不了，让动画师顶上）

### 1. 简单用 ts 实现平动逻辑
监听 onMouseUp 事件；触发后设置 Component 的 private 属性 `_startJump = true`，并根据此时的位置和按键计算速度 + 终点坐标，缓存到 private 属性中。另一边，在 update(deltaTime) 视口函数中，根据先前计算的 Component 变量计算下一帧位置，调用 this.node 的接口更新位置。

其中，在 2d 场景下坐标也是 Vec3，就是 z = 0.

### 2. 实现动画
通常我们在制作 2D 动画时，有几种办法：

- 关键帧动画：通过引擎制作，常用于如 UI 动画、序列帧动画等
- 骨骼动画：通过第三方 2D 动作制作工具导出并使用

本教程中我们会使用关键帧动画来制作角色的跳跃效果。

类似视频编辑软件，CC 提供了在时间轴上多轨道编辑的功能。编辑时，需要选定节点和轨道。轨道包括 position(xyz), rotation。

打开动画编辑器的情况下，修改 Node 的属性会自动创建关键帧，并更新新的位置。

![download](https://github.com/user-attachments/assets/0994f07f-71e3-4219-8bd4-e9451861ffe8)


可以看到，动画和代码是解耦的，动画可以帧为单位创作时间流，播放速度可能需要再调整。

创建动画前，需要把 anime 文件挂载到节点的 Animation 剪辑列表；创建动画后，需要在 ts 内触发代码播放。在本例中，TS 组件 UserController 在实现切换动画状态时，使用了 Animation.play 异步 API。获取 Animation 对象时，组件用装饰器 @property  声明了 BodyAnim 变量，该变量需要用户在 Editor 内将节点拖动到属性面板实现赋值。

    @property(Animation) // Let user set value in editor
    BodyAnim: Animation = null;

坑：不要在 x 方向设置关键帧，会冲突（动画覆盖代码的 setPosition）

## 初始化地图 - GameManager
类比 c++ 对象的 constructor，我们希望在游戏初始化的时候加载一些资源，完成初始化工作，并在整个游戏对象生命周期内保存初始化的数据。

可以创建一个名为 GameManager 的组件类，利用 start 生命周期函数满足这一需求。

- 在 GameManager 的成员中，声明 @property({type: PreFab}) 的成员变量，在编译后从 editor 指向之前保存的预制体地板
- 触发 start 时，随机生成一个 bitmap，根据 bitmap 的每一位值实例化 PreFab。cc.instantiate 函数可以克隆 PreFab 对象到场景中。

通过对象初始化后，在场景编辑器预览的界面和实际界面就不同了。

## 绘制 UI
UI 相机和 Player 相机需要挂载在两个不同的 Canvas 下。这是因为，2D 游戏类型本身有一个名为 Canvas 的节点作为角色、地图和游戏逻辑的父节点，该 Canvas 的相机会移动，导致 UI 无法渲染。因此，必须创建一个新的 Canvas (和配套 Camera) 来作为 UI 的容器。

一个参考的 UICanvas 节点关系图如下，其中 StartMenu 在点击后隐藏，Step 展示完成个数不隐藏，两个节点需要分开画。

![download](https://github.com/user-attachments/assets/1d11d9f0-0ccf-4adf-9390-6ba2982b72a7)


## 管理游戏状态 - GameManager
重构 GameManager，在支持初始化地图的基础上，管理 Player 的状态，判定游戏结束，协调 UI。

1. 用 enum{GS_INIT, GS_PLAYING, GS_END} 定义可能的状态，在设置状态的同时以同步的方式初始化成员变量。这包括 Input.on/off, StartMenu.active, 重置 Player 位置
2. 在 PlayerControler，当 isJumping 刷新时触发一个自定义的事件 JumpEnd Event；在 GameManager 监听该事件。该事件的 Handler 里，计算跳跃终点有没有掉到坑里。

## 实现卷轴效果
卷轴指的是 2d 游戏 Player 不断向右移动后相机和场景要移动。

在本例中，取消 Canvas 的 Align Canvas with Screen，把 Camera 设置成 Player 子对象保持相对距离固定，就可以让相机随屏幕移动了

## 配置多相机图层
多相机场景下，多个相机的输出会直接叠加。同一个 UI 或 Player 在屏幕上可能出现两次。可以将不同的节点设置不同的图层，然后配置每个相机的 visible 图层，实现每个物体只会出现在一个相机中。

如：UICanvas 放在 UI_2D 图层；Canvas 放在 Default 图层。两个相机一个只显示 Default 一个只显示 UI_2D

图层和节点的父子层次不是一个概念。

## 监听 IO 输入

https://docs.cocos.com/creator/3.8/manual/zh/getting-started/first-game-2d/touch.html

CC 支持 Input.on / Input.off 和 node.on / node.off 两种方式监听。类似 python 的 logging，从 Input 监听会接收所有 IO，从 node 监听会接收某个范围的 IO

在处理触摸事件时，需要用 node 分左右两个区。

小坑：用户点击开始之后可以 wait 100ms，然后再监听输入，改善体验以防误触。

# 快速开始：做一个 3d 游戏
