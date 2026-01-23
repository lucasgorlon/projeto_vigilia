import { Audio } from "expo-av"; // Importa o módulo de áudio
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

export default function HomeScreen() {
  const [senha, setSenha] = useState("");
  const [som, setSom] = useState();

  // Função para tocar a sirene
  async function tocarSirene() {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("./sirene.mp3"), // Agora que está na mesma pasta
      );
      setSom(sound);
      await sound.setIsLoopingAsync(true);
      await sound.playAsync();
    } catch (error) {
      console.log("Erro ao carregar o som:", error);
    }
  }
  // Função para parar o som e a vibração
  async function pararAlertas() {
    Vibration.cancel();
    if (som) {
      await som.stopAsync();
      await som.unloadAsync();
      setSom(undefined);
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      tocarSirene(); // Toca o som
      Vibration.vibrate([0, 500, 500, 500], true); // Vibra

      Alert.alert(
        "🚨 ALERTA DE VIGÍLIA",
        "Confirme sua presença agora!",
        [{ text: "ENTENDIDO", onPress: () => pararAlertas() }],
        { cancelable: false },
      );
    }, 10000); // 30 minutos

    return () => {
      pararAlertas();
      clearInterval(timer);
    };
  }, [som]);

  const confirmarPresenca = async () => {
    try {
      // SUBSTITUA PELO SEU LINK REAL DA RAILWAY ABAIXO:
      const URL_RAILWAY = "https://projetovigilia-production.up.railway.app"; 

      // Fazemos a chamada diretamente para o link da nuvem
      const response = await fetch(`${URL_RAILWAY}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: senha }),
      });

      if (response.ok) {
        Alert.alert("Sucesso", "✅ Log registrado na NUVEM!");
        setSenha("");
        pararAlertas();
      } else {
        Alert.alert("Erro", "Senha incorreta.");
      }
    } catch (error) {
      // Se cair aqui, o celular não conseguiu falar com a internet/Railway
      Alert.alert("Erro de Conexão", "Não foi possível alcançar o servidor na nuvem.");
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>🔒 VIGÍLIA ATIVA</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Senha"
        onChangeText={setSenha}
        value={senha}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.botao} onPress={confirmarPresenca}>
        <Text style={styles.textoBotao}>CONFIRMAR AGORA</Text>
      </TouchableOpacity>
    </View>
  );
}

// Mantenha seus estilos (styles) como estavam
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  titulo: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 20 },
  input: {
    width: "100%",
    height: 55,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
    fontSize: 18,
    textAlign: "center",
  },
  botao: {
    width: "100%",
    height: 60,
    backgroundColor: "#D32F2F",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotao: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
