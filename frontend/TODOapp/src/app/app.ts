import { Component, signal, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Tarefa } from "./tarefa";
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
 
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
 
  private platformId = inject(PLATFORM_ID);
 
  constructor(private http: HttpClient) {
    this.apiURL = 'https://apitarefas-vilacio255047-sandro253897.up.railway.app';
  }
 
  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      await this.READ_tarefas();
    }
  }
 
  CREATE_tarefa(descricaoNovaTarefa: string) {
    const novaTarefa = new Tarefa(descricaoNovaTarefa, false);
 
    this.http.post<Tarefa>(`${this.apiURL}/api/post`, novaTarefa)
      .subscribe(() => this.READ_tarefas());
  }
 
  async READ_tarefas(retry = true): Promise<void> {
    try {
      const resultado = await firstValueFrom(
        this.http.get<Tarefa[]>(`${this.apiURL}/api/getAll`, {
          headers: { 'Cache-Control': 'no-cache' }
        })
      );
 
      this.arrayDeTarefas.set(resultado);
    } catch (erro) {
      console.error("Erro ao carregar tarefas:", erro);
 
      if (retry) {
        setTimeout(() => {
          this.READ_tarefas(false);
        }, 2000);
      }
    }
  }
 
  DELETE_tarefa(tarefa: Tarefa) {
    this.http.delete<Tarefa>(`${this.apiURL}/api/delete/${tarefa._id}`)
      .subscribe(() => this.READ_tarefas());
  }
 
  UPDATE_tarefa(tarefa: Tarefa) {
    this.http.patch<Tarefa>(
      `${this.apiURL}/api/update/${tarefa._id}`,
      tarefa
    ).subscribe(() => this.READ_tarefas());
  }
}
