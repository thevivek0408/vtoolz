public class HelloGoodbye {

  /**
   * Prints greeting and goodbye to the two names
   *
   * @param args sequence of names
   */
  public static void main(String[] args) {
    System.out.println("Hello " + args[0] + " and " + args[1] + ".");
    System.out.println("Goodbye " + args[1] + " and " + args[0] + ".");
  }
}