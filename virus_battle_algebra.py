"""
Математическая "алгебра" вирусной битвы
Чистая симуляция без визуализации, только вычисления
"""

import random
import time
from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional


class CellState(Enum):
    EMPTY = 0
    VIRUS_A = 1
    VIRUS_B = 2


@dataclass
class VirusParams:
    """Параметры вируса для одной фракции"""
    aggression: int = 0      # ⚔️ Увеличивает урон в столкновениях
    mutation: int = 0        # 🧬 Шанс мутации параметров
    speed: int = 0           # ⚡ Увеличивает частоту/дальность распространения
    defense: int = 0         # 🛡️ Базовая защита от заражения/урона
    reproduction: int = 0    # 🦠 Шанс размножения в своей зоне
    stealth: int = 0         # 👻 Снижает шанс быть обнаруженным/атакованным
    virulence: int = 0       # ☣️ Увеличивает силу заражения
    resilience: int = 0      # 💪 Восстановление здоровья
    mobility: int = 0        # 🚶 Дальность перемещения/прыжков
    intellect: int = 0       # 🧠 Шанс "умного" выбора цели
    contagiousness: int = 0  # 🫁 Базовый шанс заражения соседей
    lethality: int = 0       # 💀 Урон по здоровью противника


@dataclass
class Cell:
    """Состояние одной клетки на сетке"""
    state: CellState = CellState.EMPTY
    health: float = 0.0
    infection_level: float = 0.0
    owner_params: Optional[VirusParams] = None


class VirusBattleSimulator:
    def __init__(self, width: int = 32, height: int = 20):
        self.width = width
        self.height = height
        self.grid: List[List[Cell]] = []
        self.virus_a_params = VirusParams()
        self.virus_b_params = VirusParams()
        self.instability_a = 0.0
        self.instability_b = 0.0
        self.tick_count = 0
        self.next_chaos_event = random.randint(10, 20)
        
        # Инициализация сетки
        self._initialize_grid()
        
    def _initialize_grid(self):
        """Инициализация пустой сетки"""
        self.grid = []
        for y in range(self.height):
            row = []
            for x in range(self.width):
                row.append(Cell())
            self.grid.append(row)
    
    def set_player_params(self, player: str, params: Dict[str, int]):
        """Установка параметров для игрока ('A' или 'B')"""
        virus_params = VirusParams(**params)
        
        if player.upper() == 'A':
            self.virus_a_params = virus_params
        elif player.upper() == 'B':
            self.virus_b_params = virus_params
        else:
            raise ValueError("Player must be 'A' or 'B'")
    
    def _place_initial_viruses(self):
        """Размещение начальных вирусов в своих зонах"""
        # Размещение вирусов A в верхней половине (строки 0-9)
        for _ in range(random.randint(3, 5)):
            x = random.randint(0, self.width - 1)
            y = random.randint(0, self.height // 2 - 1)
            self.grid[y][x].state = CellState.VIRUS_A
            self.grid[y][x].health = 20.0 + self.virus_a_params.defense * 2 + self.virus_a_params.resilience * 3
            self.grid[y][x].infection_level = 1.0
            self.grid[y][x].owner_params = self.virus_a_params
        
        # Размещение вирусов B в нижней половине (строки 10-19)
        for _ in range(random.randint(3, 5)):
            x = random.randint(0, self.width - 1)
            y = random.randint(self.height // 2, self.height - 1)
            self.grid[y][x].state = CellState.VIRUS_B
            self.grid[y][x].health = 20.0 + self.virus_b_params.defense * 2 + self.virus_b_params.resilience * 3
            self.grid[y][x].infection_level = 1.0
            self.grid[y][x].owner_params = self.virus_b_params
    
    def _get_neighbors(self, x: int, y: int, max_distance: int = 1) -> List[Tuple[int, int]]:
        """Получение соседей в радиусе max_distance"""
        neighbors = []
        for dy in range(-max_distance, max_distance + 1):
            for dx in range(-max_distance, max_distance + 1):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = x + dx, y + dy
                if 0 <= nx < self.width and 0 <= ny < self.height:
                    neighbors.append((nx, ny))
        return neighbors
    
    def _calculate_reproduction(self):
        """Фаза 1: Распространение/размножение"""
        new_cells = []
        
        for y in range(self.height):
            for x in range(self.width):
                cell = self.grid[y][x]
                if cell.state == CellState.EMPTY:
                    continue
                
                # Получаем параметры владельца
                params = cell.owner_params
                if not params:
                    continue
                
                # Базовый шанс размножения
                reproduction_chance = params.reproduction / 12.0 + params.speed / 24.0
                reproduction_chance = min(reproduction_chance, 1.0)  # Ограничение до 1.0
                
                if random.random() < reproduction_chance:
                    # Определяем дальность распространения
                    max_distance = 1 + (params.mobility // 3) + (params.speed // 4)
                    
                    # Получаем соседей
                    neighbors = self._get_neighbors(x, y, max_distance)
                    
                    # Выбираем случайного соседа
                    if neighbors:
                        nx, ny = random.choice(neighbors)
                        neighbor_cell = self.grid[ny][nx]
                        
                        if neighbor_cell.state == CellState.EMPTY:
                            # Заражаем пустую клетку
                            infection_level = 0.5 * params.contagiousness / 12.0
                            
                            new_cell = Cell(
                                state=cell.state,
                                health=10.0 + params.resilience * 2,
                                infection_level=infection_level,
                                owner_params=params
                            )
                            new_cells.append(((nx, ny), new_cell))
        
        # Применяем новые клетки
        for (x, y), new_cell in new_cells:
            self.grid[y][x] = new_cell
    
    def _calculate_infections_and_combats(self):
        """Фаза 2: Заражение/столкновения"""
        for y in range(self.height):
            for x in range(self.width):
                cell = self.grid[y][x]
                if cell.state == CellState.EMPTY:
                    continue
                
                params = cell.owner_params
                if not params:
                    continue
                
                # Получаем соседей
                neighbors = self._get_neighbors(x, y, 1)
                
                for nx, ny in neighbors:
                    neighbor_cell = self.grid[ny][nx]
                    
                    if neighbor_cell.state == CellState.EMPTY:
                        # Попытка заражения пустой клетки
                        if cell.state == CellState.VIRUS_A:
                            stealth_neighbor = getattr(neighbor_cell.owner_params, 'stealth', 0) if neighbor_cell.owner_params else 0
                        else:
                            stealth_neighbor = getattr(neighbor_cell.owner_params, 'stealth', 0) if neighbor_cell.owner_params else 0
                        
                        infect_chance = (
                            params.contagiousness / 12.0 * 
                            (1 - stealth_neighbor / 24.0) * 
                            params.virulence / 12.0
                        )
                        
                        if random.random() < infect_chance:
                            # Заражаем клетку
                            self.grid[ny][nx] = Cell(
                                state=cell.state,
                                health=10.0 + params.resilience * 2,
                                infection_level=min(1.0, neighbor_cell.infection_level + 0.2),
                                owner_params=params
                            )
                    
                    elif neighbor_cell.state != cell.state:
                        # Столкновение с противником
                        if cell.state == CellState.VIRUS_A:
                            attacker_params = self.virus_a_params
                            defender_params = self.virus_b_params
                        else:
                            attacker_params = self.virus_b_params
                            defender_params = self.virus_a_params
                        
                        attack_power = (
                            attacker_params.aggression + 
                            attacker_params.virulence + 
                            attacker_params.lethality
                        )
                        defend_power = (
                            defender_params.defense + 
                            defender_params.resilience + 
                            defender_params.stealth
                        )
                        
                        capture_chance = attack_power / (attack_power + defend_power) if (attack_power + defend_power) > 0 else 0.5
                        
                        damage = (
                            attacker_params.lethality / 2.0 + 
                            attacker_params.aggression / 3.0 - 
                            defender_params.defense / 4.0
                        )
                        damage = max(0, damage)
                        
                        if random.random() < capture_chance:
                            # Захватываем клетку
                            self.grid[ny][nx] = Cell(
                                state=cell.state,
                                health=max(1.0, neighbor_cell.health - damage),
                                infection_level=neighbor_cell.infection_level,
                                owner_params=attacker_params
                            )
                        else:
                            # Наносим урон, но не захватываем
                            self.grid[ny][nx].health = max(0, neighbor_cell.health - damage)
                            
                            # Если здоровье <= 0, клетка может стать пустой или перейти атакующему
                            if self.grid[ny][nx].health <= 0:
                                if random.random() < 0.5:
                                    self.grid[ny][nx] = Cell()
                                else:
                                    self.grid[ny][nx] = Cell(
                                        state=cell.state,
                                        health=5.0 + attacker_params.resilience,
                                        infection_level=0.5,
                                        owner_params=attacker_params
                                    )
    
    def _calculate_mutations_and_weakening(self):
        """Фаза 3: Мутации и ослабление"""
        # Подсчет контроля территории
        total_cells = self.width * self.height
        a_control = sum(1 for row in self.grid for cell in row if cell.state == CellState.VIRUS_A)
        b_control = sum(1 for row in self.grid for cell in row if cell.state == CellState.VIRUS_B)
        
        a_control_percent = (a_control / total_cells) * 100
        b_control_percent = (b_control / total_cells) * 100
        
        # Расчет нестабильности
        if a_control_percent > 70:
            self.instability_a += (a_control_percent - 70) / 100 * 2
        else:
            self.instability_a *= 0.9  # Уменьшаем нестабильность
            
        if b_control_percent > 70:
            self.instability_b += (b_control_percent - 70) / 100 * 2
        else:
            self.instability_b *= 0.9  # Уменьшаем нестабильность
        
        # Мутации
        if random.random() < self.virus_a_params.mutation / 12.0:
            # Мутация параметров вируса A
            attr_names = [attr for attr in dir(self.virus_a_params) if not attr.startswith('_')]
            if attr_names:
                attr_name = random.choice(attr_names)
                if hasattr(self.virus_a_params, attr_name):
                    current_value = getattr(self.virus_a_params, attr_name)
                    # Изменение на ±1-3 с возможностью негативного изменения
                    change = random.randint(1, 3) if random.random() < 0.7 else random.randint(-3, -1)
                    new_value = max(0, min(12, current_value + change))
                    setattr(self.virus_a_params, attr_name, new_value)
        
        if random.random() < self.virus_b_params.mutation / 12.0:
            # Мутация параметров вируса B
            attr_names = [attr for attr in dir(self.virus_b_params) if not attr.startswith('_')]
            if attr_names:
                attr_name = random.choice(attr_names)
                if hasattr(self.virus_b_params, attr_name):
                    current_value = getattr(self.virus_b_params, attr_name)
                    # Изменение на ±1-3 с возможностью негативного изменения
                    change = random.randint(1, 3) if random.random() < 0.7 else random.randint(-3, -1)
                    new_value = max(0, min(12, current_value + change))
                    setattr(self.virus_b_params, attr_name, new_value)
    
    def _calculate_events(self):
        """Фаза 4: События хаоса"""
        if self.tick_count == self.next_chaos_event:
            # Определяем тип события
            chaos_chance = 0.1 + max(self.instability_a, self.instability_b) * 0.2
            
            if random.random() < chaos_chance:
                event_type = random.choice([
                    "global_outbreak", "weakening", "super_mutation", "collapse"
                ])
                
                print(f"Chaos event at tick {self.tick_count}: {event_type}")
                
                if event_type == "global_outbreak":
                    # Глобальная вспышка: +20% к Contagiousness всем на 3 тика
                    self.virus_a_params.contagiousness = int(min(12, self.virus_a_params.contagiousness * 1.2))
                    self.virus_b_params.contagiousness = int(min(12, self.virus_b_params.contagiousness * 1.2))
                
                elif event_type == "weakening":
                    # Ослабление: -30% здоровья случайным 10% клеток доминирующей фракции
                    dominant_faction = CellState.VIRUS_A if self._count_cells(CellState.VIRUS_A) > self._count_cells(CellState.VIRUS_B) else CellState.VIRUS_B
                    faction_cells = [(x, y) for y in range(self.height) for x in range(self.width) 
                                     if self.grid[y][x].state == dominant_faction]
                    target_count = max(1, len(faction_cells) // 10)
                    targets = random.sample(faction_cells, min(target_count, len(faction_cells)))
                    
                    for x, y in targets:
                        self.grid[y][x].health *= 0.7  # Уменьшаем здоровье на 30%
                
                elif event_type == "super_mutation":
                    # Супермутация: +5 к случайному параметру лидера, но +instability*2
                    dominant_faction = CellState.VIRUS_A if self._count_cells(CellState.VIRUS_A) > self._count_cells(CellState.VIRUS_B) else CellState.VIRUS_B
                    
                    if dominant_faction == CellState.VIRUS_A:
                        attr_names = [attr for attr in dir(self.virus_a_params) if not attr.startswith('_')]
                        if attr_names:
                            attr_name = random.choice(attr_names)
                            current_value = getattr(self.virus_a_params, attr_name)
                            new_value = min(12, current_value + 5)
                            setattr(self.virus_a_params, attr_name, new_value)
                            self.instability_a += self.instability_a * 2
                    else:
                        attr_names = [attr for attr in dir(self.virus_b_params) if not attr.startswith('_')]
                        if attr_names:
                            attr_name = random.choice(attr_names)
                            current_value = getattr(self.virus_b_params, attr_name)
                            new_value = min(12, current_value + 5)
                            setattr(self.virus_b_params, attr_name, new_value)
                            self.instability_b += self.instability_b * 2
                
                elif event_type == "collapse":
                    # Коллапс: Если контроль >90%, сброс 20% клеток в EMPTY
                    dominant_faction = CellState.VIRUS_A if self._count_cells(CellState.VIRUS_A) > self._count_cells(CellState.VIRUS_B) else CellState.VIRUS_B
                    control_percent = (self._count_cells(dominant_faction) / (self.width * self.height)) * 100
                    
                    if control_percent > 90:
                        faction_cells = [(x, y) for y in range(self.height) for x in range(self.width) 
                                         if self.grid[y][x].state == dominant_faction]
                        collapse_count = max(1, len(faction_cells) // 5)  # 20%
                        targets = random.sample(faction_cells, min(collapse_count, len(faction_cells)))
                        
                        for x, y in targets:
                            self.grid[y][x] = Cell()  # Сбрасываем в EMPTY
            
            # Устанавливаем следующее событие
            self.next_chaos_event = self.tick_count + random.randint(10, 20)
    
    def _calculate_recovery(self):
        """Фаза 5: Восстановление"""
        for y in range(self.height):
            for x in range(self.width):
                cell = self.grid[y][x]
                if cell.state != CellState.EMPTY and cell.owner_params:
                    # Восстановление здоровья
                    recovery_amount = cell.owner_params.resilience / 5.0
                    cell.health = min(20.0 + cell.owner_params.defense * 2 + cell.owner_params.resilience * 3, 
                                      cell.health + recovery_amount)
                    
                    # Увеличение уровня заражения для живых клеток
                    if cell.state != CellState.EMPTY:
                        cell.infection_level = min(1.0, cell.infection_level + 0.05)
    
    def _count_cells(self, state: CellState) -> int:
        """Подсчет количества клеток указанного состояния"""
        return sum(1 for row in self.grid for cell in row if cell.state == state)
    
    def _check_victory(self) -> Optional[str]:
        """Фаза 6: Проверка победы"""
        total_cells = self.width * self.height
        a_control = self._count_cells(CellState.VIRUS_A)
        b_control = self._count_cells(CellState.VIRUS_B)
        
        a_percent = (a_control / total_cells) * 100
        b_percent = (b_control / total_cells) * 100
        
        if a_percent >= 99:
            return "A"
        elif b_percent >= 99:
            return "B"
        
        return None
    
    def simulate_tick(self) -> Optional[str]:
        """Основная функция симуляции одного тика"""
        self.tick_count += 1
        
        # Выполняем все фазы
        self._calculate_reproduction()
        self._calculate_infections_and_combats()
        self._calculate_mutations_and_weakening()
        self._calculate_events()
        self._calculate_recovery()
        
        # Проверяем победу
        winner = self._check_victory()
        
        # Выводим статистику каждые 10 тиков
        if self.tick_count % 10 == 0:
            a_control = self._count_cells(CellState.VIRUS_A)
            b_control = self._count_cells(CellState.VIRUS_B)
            empty_cells = self._count_cells(CellState.EMPTY)
            
            print(f"Tick {self.tick_count}: A={a_control} ({a_control/(self.width*self.height)*100:.1f}%), "
                  f"B={b_control} ({b_control/(self.width*self.height)*100:.1f}%), "
                  f"Empty={empty_cells} ({empty_cells/(self.width*self.height)*100:.1f}%), "
                  f"Instability A={self.instability_a:.2f}, B={self.instability_b:.2f}")
        
        return winner
    
    def print_grid(self):
        """Вывод сетки в консоль (упрощенный вариант)"""
        symbols = {CellState.EMPTY: '.', CellState.VIRUS_A: 'A', CellState.VIRUS_B: 'B'}
        
        for y in range(self.height):
            row_str = ""
            for x in range(self.width):
                cell = self.grid[y][x]
                row_str += symbols[cell.state]
            print(row_str)
        print()


def run_simulation():
    """Функция для запуска симуляции"""
    # Устанавливаем фиксированный seed для воспроизводимости
    random.seed(42)
    
    # Создаем симулятор
    simulator = VirusBattleSimulator()
    
    # Устанавливаем параметры для игроков (например, равные)
    player_a_params = {
        'aggression': 3,
        'mutation': 2,
        'speed': 4,
        'defense': 3,
        'reproduction': 5,
        'stealth': 2,
        'virulence': 4,
        'resilience': 3,
        'mobility': 4,
        'intellect': 3,
        'contagiousness': 5,
        'lethality': 3
    }
    
    player_b_params = {
        'aggression': 4,
        'mutation': 3,
        'speed': 3,
        'defense': 4,
        'reproduction': 4,
        'stealth': 3,
        'virulence': 3,
        'resilience': 4,
        'mobility': 3,
        'intellect': 4,
        'contagiousness': 4,
        'lethality': 4
    }
    
    simulator.set_player_params('A', player_a_params)
    simulator.set_player_params('B', player_b_params)
    
    # Размещаем начальные вирусы
    simulator._place_initial_viruses()
    
    print("Initial state:")
    simulator.print_grid()
    
    print(f"Player A params: {simulator.virus_a_params}")
    print(f"Player B params: {simulator.virus_b_params}")
    print("\nStarting simulation...\n")
    
    # Запускаем симуляцию
    max_ticks = 500  # Максимальное количество тиков
    winner = None
    
    for tick in range(max_ticks):
        winner = simulator.simulate_tick()
        if winner:
            break
        
        # Показываем состояние каждые 50 тиков
        if (tick + 1) % 50 == 0:
            print(f"\nState at tick {tick + 1}:")
            simulator.print_grid()
    
    # Выводим результаты
    if winner:
        print(f"\nVICTORY! Player {winner} wins at tick {simulator.tick_count}!")
    else:
        print(f"\nSimulation ended after {max_ticks} ticks with no winner.")
    
    # Финальная статистика
    a_control = simulator._count_cells(CellState.VIRUS_A)
    b_control = simulator._count_cells(CellState.VIRUS_B)
    empty_cells = simulator._count_cells(CellState.EMPTY)
    
    print(f"\nFinal stats:")
    print(f"Player A: {a_control} cells ({a_control/(simulator.width*simulator.height)*100:.1f}%)")
    print(f"Player B: {b_control} cells ({b_control/(simulator.width*simulator.height)*100:.1f}%)")
    print(f"Empty: {empty_cells} cells ({empty_cells/(simulator.width*simulator.height)*100:.1f}%)")
    print(f"Final instability - A: {simulator.instability_a:.2f}, B: {simulator.instability_b:.2f}")


if __name__ == "__main__":
    run_simulation()