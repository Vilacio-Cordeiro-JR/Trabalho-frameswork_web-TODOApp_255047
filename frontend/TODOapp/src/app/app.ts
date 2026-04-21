import { Component, signal, OnInit } from '@angular/core';
import { Tarefa } from "./tarefa";
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App implements OnInit {

  protected readonly title = signal('TODOapp');

  arrayDeTarefas = signal<Tarefa[]>([]);
  apiURL: string;

  constructor(private http: HttpClient) {
    this.apiURL = 'https://vilacio255047.up.railway.app';
    this.READ_tarefas();
  }

  // ✅ Carrega ao iniciar
  ngOnInit() {
    this.READ_tarefas();
  }

  // ✅ CREATE corrigido
  CREATE_tarefa(descricaoNovaTarefa: string) {
    const novaTarefa = new Tarefa(descricaoNovaTarefa, false);

    this.http.post<Tarefa>(`${this.apiURL}/api/post`, novaTarefa)
      .subscribe(() => this.READ_tarefas());
  }

  // ✅ READ ok
 READ_tarefas(retry = true) {
  this.http.get<Tarefa[]>(`${this.apiURL}/api/getAll`)
    .subscribe({
      next: (resultado) => {
        this.arrayDeTarefas.set(resultado);
      },
      error: (erro) => {
        console.error("Erro ao carregar tarefas:", erro);

        // tenta novamente depois de 2 segundos
        if (retry) {
          setTimeout(() => this.READ_tarefas(false), 2000);
        }
      }
    });
}

  // ✅ DELETE corrigido (sem indexOf)
  DELETE_tarefa(tarefa: Tarefa) {
    this.http.delete<Tarefa>(`${this.apiURL}/api/delete/${tarefa._id}`)
      .subscribe(() => this.READ_tarefas());
  }

  // ✅ UPDATE corrigido (sem indexOf)
  UPDATE_tarefa(tarefa: Tarefa) {
    this.http.patch<Tarefa>(
      `${this.apiURL}/api/update/${tarefa._id}`,
      tarefa
    ).subscribe(() => this.READ_tarefas());
  }

}
