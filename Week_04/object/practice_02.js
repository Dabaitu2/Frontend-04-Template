const STATUS = {
    healthy: 1,
    suffered: 2,
    die: 3
}

class Live {
    health;
    attack;
    defense;
    status;
    name;

    constructor({health, attack, defense, name}) {
        this.health = health;
        this.attack = attack;
        this.defense = defense;
        this.name = name;
        this.checkStatus();
    }

    suffer(attack) {
        this.health = attack - this.defense;
        this.checkStatus();
    }

    checkStatus() {
        if (this.health === 100) {
            this.status = STATUS.healthy;
            console.log(this.name + '很健康');
        } else if (this.health <= 0) {
            this.status = STATUS.die;
            console.log(this.name + '去世了');
        } else {
            this.status = STATUS.suffered;
            console.log(this.name + '受伤了');
        }
    }
}

/**
 * 状态的改变应该由持有状态的对象来处理
 * 对外应该只保留最小接口
 * 行为改变状态
 */
class Dog extends Live {
    bite(target) {
        console.log(this.name + '咬了' + target.name);
        target.suffer(this.attack);
    }
}

class Human extends Live {
}

let xiaoming = new Human({
    health: 100,
    attack: 10,
    defense: 10,
    name: '小明',
})

let dahuang = new Dog({
    health: 100,
    attack: 50,
    defense: 5,
    name: '大黄',
})

dahuang.bite(xiaoming);
