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

  // No app.ts
  roleUsuario = signal('');
  nomeUsuario = signal('');

  // 1. Defina o signal no topo com os outros signals
  darkMode = signal(false);

  Login(username: string, password: string) {
    this.http.post(`${this.apiURL}/api/login`, { nome: username, senha: password })
      .subscribe((res: any) => {
        this.tokenJWT = JSON.stringify(res);
        this.roleUsuario.set(res.role);
        this.nomeUsuario.set(username);

        this.darkMode.set(res.darkMode);
        if (res.darkMode) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }

        // 2. CORREÇÃO: Carrega a preferência que veio do banco no login
        if (res.darkMode !== undefined) {
          this.darkMode.set(res.darkMode);
        }

        this.READ_tarefas();
      });
  }

  // 3. CORREÇÃO: Este deve ser um método dentro da classe
  toggleDarkMode() {
    const novoEstado = !this.darkMode();
    this.darkMode.set(novoEstado);

    if (novoEstado) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    const token = JSON.parse(this.tokenJWT).token;
    this.http.patch(`${this.apiURL}/api/usuario/tema`, { darkMode: novoEstado }, {
      headers: { 'id-token': token }
    }).subscribe({
      error: (err) => console.error("Erro ao salvar tema:", err)
    });
  }

  // Adicione este signal nas propriedades da classe
  modoRegistro = signal(false);

  toggleModo() {
    this.modoRegistro.set(!this.modoRegistro());
  }

  Register(username: string, password: string) {
    const credenciais = { "nome": username, "senha": password };

    this.http.post(`${this.apiURL}/api/register`, credenciais).subscribe({
      next: () => {
        alert('Conta criada! Agora faça o login.');
        this.modoRegistro.set(false);
      },
      //error: (err) => alert('Erro ao registrar: ' + err.error.message)
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

  listaUsuarios = signal<any[]>([]);

  // 1. LISTAR: Busca todos os usuários no banco
  LISTAR_usuarios() {
    const token = JSON.parse(this.tokenJWT).token;
    this.http.get<any[]>(`${this.apiURL}/api/usuarios`, {
      headers: { 'id-token': token }
    }).subscribe({
      next: (res) => this.listaUsuarios.set(res),
      error: (err) => console.error('Erro ao listar:', err)
    });
  }

  // 2. PROMOVER: Altera a role do usuário para 'adm'
  PROMOVER_usuario(id: string) {
    const token = JSON.parse(this.tokenJWT).token;
    this.http.patch(`${this.apiURL}/api/usuario/promover/${id}`, {}, {
      headers: { 'id-token': token }
    }).subscribe({
      next: () => {
        alert('Usuário promovido!');
        this.LISTAR_usuarios(); // Atualiza a lista na tela
      },
      error: (err) => alert('Erro: ' + err.error.message)
    });
  }

  // 3. DELETAR: Remove o usuário permanentemente
  DELETAR_usuario(id: string) {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;

    const token = JSON.parse(this.tokenJWT).token;
    this.http.delete(`${this.apiURL}/api/usuario/${id}`, {
      headers: { 'id-token': token }
    }).subscribe({
      next: () => {
        alert('Usuário removido!');
        this.LISTAR_usuarios(); // Atualiza a lista na tela
      },
      error: (err) => alert('Erro ao deletar: ' + err.error.message)
    });
  }
  // Adicione no topo da classe App
  CRIAR_usuario(nome: string, senha: string, role: string) {
    const token = JSON.parse(this.tokenJWT).token;
    this.http.post(`${this.apiURL}/api/usuario/criar`, { nome, senha, role }, {
      headers: { 'id-token': token }
    }).subscribe({
      next: () => {
        alert('Usuário criado!');
        this.LISTAR_usuarios();
      },
      error: (err) => alert('Erro: ' + err.error.message)
    });
  }

  // No app.ts, ajuste a função para evitar erros com o 'null' do prompt
  EDITAR_usuario(id: string, novoNome: string | null) {
    if (!novoNome) return; // Se cancelar ou deixar vazio, não faz nada

    const token = JSON.parse(this.tokenJWT).token;
    this.http.patch(`${this.apiURL}/api/usuario/editar/${id}`, { nome: novoNome }, {
      headers: { 'id-token': token }
    }).subscribe({
      next: () => {
        this.LISTAR_usuarios();
      },
      error: (err) => alert('Erro: ' + err.error.message)
    });
  }

  abrirPromptEdicao(usuario: any) {
    // Agora o 'prompt' funciona porque o TS reconhece o escopo do window
    const novoNome = prompt(`Novo nome para ${usuario.nome}:`, usuario.nome);

    if (novoNome !== null && novoNome.trim() !== "") {
      this.EDITAR_usuario(usuario._id, novoNome);
    }
  }

  abrirPromptSenha(usuario: any) {
    const novaSenha = prompt(`Digite a nova senha para ${usuario.nome}:`);

    // Verifica se não é nulo e se tem pelo menos 4 caracteres (opcional)
    if (novaSenha !== null && novaSenha.trim().length >= 4) {
      this.ALTERAR_SENHA_usuario(usuario._id, novaSenha);
    } else if (novaSenha !== null) {
      alert("A senha deve ter pelo menos 4 caracteres.");
    }
  }

  ALTERAR_SENHA_usuario(id: string, senha: string) {
    const token = JSON.parse(this.tokenJWT).token;

    this.http.patch(`${this.apiURL}/api/usuario/editar/${id}`, { senha: senha }, {
      headers: { 'id-token': token }
    }).subscribe({
      next: () => {
        alert('Senha alterada com sucesso!');
        this.LISTAR_usuarios();
      },
      error: (err) => alert('Erro ao alterar senha: ' + err.error.message)
    });
  }

  painelAdminAberto = signal(false);

  toggleAdminPainel() {
    this.painelAdminAberto.set(!this.painelAdminAberto());

    // Se abrir e a lista estiver vazia, carrega automaticamente
    if (this.painelAdminAberto() && this.listaUsuarios().length === 0) {
      this.LISTAR_usuarios();
    }
  }

  tarefasFeitas() {
    // Filtra o array de tarefas para contar apenas as que possuem statusRealizada = true
    return this.arrayDeTarefas().filter(t => t.statusRealizada).length;
  }


}


