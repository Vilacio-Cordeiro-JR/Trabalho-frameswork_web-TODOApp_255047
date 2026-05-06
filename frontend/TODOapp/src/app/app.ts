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
  usuarioLogado = signal(false);

  tokenJWT = '{ "token": "" }';


  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {
    this.apiURL = 'https://apitarefas-vilacio255047-sandro253897.up.railway.app';
  }

ogin(username: string, password: string) {
  var credenciais = { "nome": username, "senha": password }

  this.http.post(`${this.apiURL}/api/login`, credenciais).subscribe(resultado => {
    this.tokenJWT = JSON.stringify(resultado);

    // 👉 ESSENCIAL
    this.READ_tarefas();
  });
}

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {

    }
  }

  CREATE_tarefa(descricaoNovaTarefa: string) {
    const novaTarefa = new Tarefa(descricaoNovaTarefa, false);
    const token = JSON.parse(this.tokenJWT).token;

    this.http.post<Tarefa>(`${this.apiURL}/api/post`, novaTarefa, {
      headers: { 'id-token': token }
    }).subscribe(() => this.READ_tarefas());
  }

  async READ_tarefas(retry = true): Promise<void> {
    try {
      const token = JSON.parse(this.tokenJWT).token;

      const resultado = await firstValueFrom(
        this.http.get<Tarefa[]>(`${this.apiURL}/api/getAll`, {
          headers: {
            'Cache-Control': 'no-cache',
            'id-token': token   // 👈 AQUI ESTÁ O SEGREDO
          }
        })
      );

      this.arrayDeTarefas.set(resultado);
      this.usuarioLogado.set(true);

    } catch (erro) {
      console.error("Erro ao carregar tarefas:", erro);
      this.usuarioLogado.set(false);

      if (retry) {
        setTimeout(() => {
          this.READ_tarefas(false);
        }, 2000);
      }
    }
  }

  DELETE_tarefa(tarefa: Tarefa) {
    const token = JSON.parse(this.tokenJWT).token;

    this.http.delete<Tarefa>(`${this.apiURL}/api/delete/${tarefa._id}`, {
      headers: { 'id-token': token }
    }).subscribe(() => this.READ_tarefas());
  }

  UPDATE_tarefa(tarefa: Tarefa) {
    const token = JSON.parse(this.tokenJWT).token;

    this.http.patch<Tarefa>(
      `${this.apiURL}/api/update/${tarefa._id}`,
      tarefa,
      {
        headers: { 'id-token': token }
      }
    ).subscribe(() => this.READ_tarefas());
  }
}
