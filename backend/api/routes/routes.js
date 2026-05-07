const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router()
module.exports = router;
const modeloTarefa = require('../models/tarefa');
const Usuario = require('../models/usuario');

// ROTA DE REGISTRO
router.post('/register', async (req, res) => {
  try {
    const { nome, senha, role } = req.body;
    
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const novoUsuario = new Usuario({
      nome,
      senha: senhaHash,
      role: role || 'user'
    });

    await novoUsuario.save();
    res.status(201).json({ message: "Usuário criado!" });
  } catch (error) {
    res.status(400).json({ message: "Erro ao registrar usuário" });
  }
});

// ROTA DE LOGIN (Substituindo a antiga)
router.post('/login', async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ nome: req.body.nome });
    if (!usuario) return res.status(401).json({ message: 'Usuário não encontrado' });

    const senhaValida = await bcrypt.compare(req.body.senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ message: 'Senha incorreta' });

    // Incluímos o ID e o ROLE no token
    const token = jwt.sign(
      { id: usuario._id, role: usuario.role }, 
      'segredo', 
      { expiresIn: '1h' }
    );

    res.json({ auth: true, token: token, role: usuario.role });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

//Autorizacao
function verificaUsuarioSenha(req, res, next) {
 if (req.body.nome !== 'branqs' || req.body.senha !== '1234') {
 return res.status(401).json({ auth: false, message: 'Usuario ou Senha incorreta' });
 }
 next();
}

//Nova forma de Autorizacao
function verificaJWT(req, res, next) {
 const token = req.headers['id-token'];
 if (!token) return res.status(401).json({
 auth: false, message: 'Token nao fornecido'
 });
 jwt.verify(token,'segredo', function (err, decoded) {
 if (err) return res.status(500).json({ auth: false, message: 'Falha !' });
 next();
 });
}

router.post('/post', async (req, res) => {
    const objetoTarefa = new modeloTarefa({
    descricao: req.body.descricao,
    statusRealizada: req.body.statusRealizada
    })
    try {
    const tarefaSalva = await objetoTarefa.save();
    res.status(200).json(tarefaSalva)
    }
    catch (error) {
    res.status(400).json({ message: error.message })
    }
   })

router.get('/getAll', async (req, res) => {
    try {
    const resultados = await modeloTarefa.find();
    res.json(resultados)
    }
    catch (error) {
    res.status(500).json({ message: error.message })
    }
   })

router.delete('/delete/:id', async (req, res) => {
    try {
    const resultado = await modeloTarefa.findByIdAndDelete(req.params.id)
    res.json(resultado)
    }
    catch (error) {
    res.status(400).json({ message: error.message })
    }
   })

router.patch('/update/:id', async (req, res) => {
    try {
    const id = req.params.id;
    const novaTarefa = req.body;
    const options = { new: true };
    const result = await modeloTarefa.findByIdAndUpdate(
    id, novaTarefa, options
    )
    res.json(result)
    }
    catch (error) {
    res.status(400).json({ message: error.message })
    }
   })
   
   
   
