import { _decorator, CCInteger, Component, instantiate, Label, Node, Prefab, Vec3 } from 'cc';
import { BLOCK_SIZE, PlayerController } from './PlayerController';
const { ccclass, property } = _decorator;

enum BlockType {
    BT_NONE,
    BT_STONE,
};

enum GameState {
    GS_INIT,
    GS_PLAYING,
    GS_END,
};

@ccclass('GameManager')
export class GameManager extends Component {
    private _road: BlockType[] = []; // Road data

    @property({ type: Prefab })
    public boxPrefab: Prefab | null = null; // Box prefab to create map
    @property({ type: CCInteger })
    public roadLength: number = 50; // Settings for road length
    @property({ type: Node })
    public startMenu: Node | null = null;
    @property({ type: PlayerController })
    public playerCtrl: PlayerController | null = null;
    @property({ type: Label })
    public stepsLabel: Label | null = null;

    start() {
        this.setCurState(GameState.GS_INIT); // 第一初始化要在 start 里面调用
        this.playerCtrl?.node.on("JumpEnd", this.onPlayerJumpEnd, this); // 必须用派发事件的节点来监听
    }

    init() {
        if (this.startMenu) {
            this.startMenu.active = true;
        }

        this.generateRoad();

        if (this.playerCtrl) {
            this.playerCtrl.setInputActive(false);
            this.playerCtrl.node.setPosition(Vec3.ZERO);
            this.playerCtrl.reset();
        }
        console.log(this)
    }

    bgnPlay() {
        if (this.startMenu) {
            this.startMenu.active = false;
        }
        if (this.stepsLabel) {
            this.stepsLabel.string = '0';   // 将步数重置为0
        }

        setTimeout(() => {      //直接设置active会直接开始监听鼠标事件，做了一下延迟处理
            console.log(this)
            if (this.playerCtrl) {
                this.playerCtrl.setInputActive(true);
            }
        }, 0.1);
    }

    setCurState(value: GameState) {
        switch (value) {
            case GameState.GS_INIT:
                this.init();
                break;
            case GameState.GS_PLAYING:
                this.bgnPlay();
                break;
            case GameState.GS_END:
                break;
        }
    }

    generateRoad() {

        this.node.removeAllChildren();

        this._road = [];
        // startPos
        this._road.push(BlockType.BT_STONE);

        for (let i = 1; i < this.roadLength; i++) {
            if (this._road[i - 1] === BlockType.BT_NONE) {
                this._road.push(BlockType.BT_STONE);
            } else {
                this._road.push(Math.floor(Math.random() * 2));
            }
        }

        for (let j = 0; j < this._road.length; j++) {
            let block: Node | null = this.spawnBlockByType(this._road[j]);
            if (block) {
                this.node.addChild(block);
                block.setPosition(j * BLOCK_SIZE, 0, 0);
            }
        }
    }

    spawnBlockByType(type: BlockType) {
        if (!this.boxPrefab) {
            return null;
        }

        let block: Node | null = null;
        switch (type) {
            case BlockType.BT_STONE:
                block = instantiate(this.boxPrefab); // Clone a prefab of any type
                break;
        }

        return block;
    }

    onStartButtonClicked() {
        this.setCurState(GameState.GS_PLAYING);
    }

    onPlayerJumpEnd(moveIndex: number) {
        if (this.stepsLabel) {
            this.stepsLabel.string = '' + (moveIndex >= this.roadLength ? this.roadLength : moveIndex);
        }
        this.checkResult(moveIndex);
    }

    checkResult(moveIndex: number) {
        if (moveIndex < this.roadLength) {
            if (this._road[moveIndex] == BlockType.BT_NONE) {   //跳到了空方块上

                this.setCurState(GameState.GS_INIT)
            }
        } else {    // 跳过了最大长度            
            this.setCurState(GameState.GS_INIT);
        }
    }
}